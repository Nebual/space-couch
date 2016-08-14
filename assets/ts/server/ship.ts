import {NetPacket, Connection} from "./ServerNet";
import {Game} from "./Game";
const PF = require('pathfinding');
export enum RoomType {
	None,
	Engine,
	Generator,
	Weapons,
	Robotics,
	Shields,
	Navigation,
	Cockpit
}

export interface Robot {
	id: number;
	left: number;
	top: number;
}

interface Node {
	top: number;
	left: number;

	room: RoomType;

	// Connections
	north: boolean;
	east: boolean;
	south: boolean;
	west: boolean;

	onFire: boolean;
	isBroken: boolean;
}
class Room {
	type: RoomType = RoomType.None;
	nodes: Node[] = [];

	condition: number = 1;
	isBroken: boolean = false;

	constructor(type: RoomType) {
		this.type = type;
	}
}

export class ShipNodes {
	private game: Game;
	private nodes: {[XxY: string]: Node} = {};
	private rooms: {[room: number]: Room} = {};
	public robots: Robot[] = [];
	private grid;
	private finder;
	private partsRemaining: number = 0;

	constructor(game: Game, layout: string) {
		this.game = game;

		// Create a matrix that's entirely unwalkable by default
		// 2x as large as our grid size, so there's odd "wall" nodes between each even grid cell
		let rows = [], b;
		while (rows.length < 8*2) {
			rows.push(b = []);
			while (b.push(1) < 13*2);
		}
		this.grid = new PF.Grid(rows);
		this.finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true
		});

		let shipType = <ShipType>ShipTypes[layout];
		let grid = shipType.nodes;
		for (let row of grid) {
			let node = <Node>{
				'left' : row[0],
				'top'  : row[1],
				'room' : row[2],
				'north': row[3].includes('n'),
				'east' : row[3].includes('e'),
				'south': row[3].includes('s'),
				'west' : row[3].includes('w')
			};
			this.nodes[node.left + 'x' + node.top] = node;
			if(!this.rooms[node.room]) this.rooms[node.room] = new Room(node.room);
			this.rooms[node.room].nodes.push(node);
			this.grid.setWalkableAt(node.left*2, node.top*2, true);
			if(node.north) this.grid.setWalkableAt(node.left*2, node.top*2 - 1, true);
			if(node.east) this.grid.setWalkableAt(node.left*2 + 1, node.top*2, true);
			if(node.south) this.grid.setWalkableAt(node.left*2, node.top*2 + 1, true);
			if(node.west) this.grid.setWalkableAt(node.left*2 - 1, node.top*2, true);
			// Kinda a hack, but open up nodes in the middle of the room too
			if(node.north && node.west && this.grid.isWalkableAt(node.left*2 - 1, node.top*2 - 2)) this.grid.setWalkableAt(node.left*2 - 1, node.top*2 - 1, true);
			if(node.south && node.west && this.grid.isWalkableAt(node.left*2 - 1, node.top*2 + 2)) this.grid.setWalkableAt(node.left*2 - 1, node.top*2 + 1, true);
		}
		this.debug_grid();
		this.createRobots(shipType.numRobots);
		this.partsRemaining = shipType.numParts;
	}

	public debug_grid(grid=null)
	{
		if(!grid) grid = this.grid;
		let s = '';
		for(let row of grid.nodes) {
			for(let cell of row) {
				s += (cell.walkable ? ' ' : 'X');
			}
			s += "\n";
		}
		console.log(s);
	}

	public getNode(x:number, y:number): Node {
		return this.nodes[`${x}x${y}`];
	}

	createRobots(num: number)
	{
		for (let node of this.rooms[RoomType.Robotics].nodes) {
			this.robots.push(<Robot>{'left':node.left, 'top':node.top, 'id': this.robots.length});
			if (--num <= 0) break;
		}
	}

	public onMessage(msg: NetPacket) {
		switch(msg.event) {
			case 'moveRobot':
				this.moveRobot(<number>msg.id, msg.value);
				break;
			case 'robotAction':
				this.robotAction(<number>msg.id, msg.value);
		}
	}

	public initConnection(connection:Connection) {
		switch(connection.role) {
			case 'robotics': {
				connection.sendEvent('robots', this.robots);
				for(let node_id in this.nodes) {
					let node = this.nodes[node_id];
					if(node.onFire) connection.send({event: 'nodeState', id: 'fire', value: {'left': node.left, 'top': node.top, 'state': node.onFire}});
					if(node.isBroken) connection.send({event: 'nodeState', id: 'sparks', value: {'left': node.left, 'top': node.top, 'state': node.isBroken}});
				}
				break;
			}
		}
	}

	public moveRobot(id:number, coord) {
		let robot = this.robots[id];
		let node = this.getNode(coord[0], coord[1]);
		if(!robot || !node || (coord[0]===robot.left && coord[1]===robot.top)) return;

		let path = this.finder.findPath(robot.left*2, robot.top*2, coord[0]*2, coord[1]*2, this.grid.clone());
		path = PF.Util.compressPath(path);
		for(let i=0; i<path.length; i++) {
			path[i][0] /= 2;
			path[i][1] /= 2;
		}
		robot.left = coord[0];
		robot.top = coord[1];
		this.game.net.broadcast({'event': 'robotPath', 'id': id, 'value': path}, 'robotics');
	}

	private robotAction(robot_id:number, action:string) {
		let robot = this.robots[robot_id];
		let node = this.nodes[robot.left+'x'+robot.top];
		switch(action) {
			case 'extinguish':
				if(!node.onFire) break;

				this.game.setRoleState('robotics', 'robot_'+robot_id, true);
				setTimeout(() => {
					let node = this.nodes[robot.left+'x'+robot.top];
					if(node.onFire) {
						this.stopFire(node);
					}
					this.game.setRoleState('robotics', 'robot_'+robot_id, false);
				}, 5000);
				break;
			case 'repair':
			case 'replace':
				if(!node.isBroken) break;
				if(action === 'repair' && !this.hasPart(node.room)) break;

				this.game.setRoleState('robotics', 'robot_'+robot_id, true);
				setTimeout(() => {
					let node = this.nodes[robot.left+'x'+robot.top];
					if(node.isBroken) {
						this.repairNode(node, action === 'replace');
					}
					this.game.setRoleState('robotics', 'robot_'+robot_id, false);
				}, action === 'repair' ? 5000 : 15000);
				break;
		}
	}

	public startFire(roomType:RoomType): boolean {
		let nodes = this.rooms[roomType].nodes.slice();
		while(nodes.length) {
			let i = Math.floor(Math.random()*nodes.length);
			let node = nodes[i];
			if(node.onFire) {
				nodes.splice(i, 1);
				continue;
			}
			node.onFire = true;
			this.game.net.broadcastEvent('nodeState', 'fire', {'left': node.left, 'top': node.top, 'state': node.onFire}, 'robotics');
			return true;
		}
		return false;
	}

	public stopFire(node:Node): void {
		node.onFire = false;
		this.game.net.broadcastEvent('nodeState', 'fire', {'left': node.left, 'top': node.top, 'state': node.onFire}, 'robotics');
	}

	private hasPart(roomType:RoomType): boolean {
		// todo: different rooms might need different parts?
		return (this.partsRemaining > 0);
	}

	private consumePart(roomType:RoomType): boolean {
		if(!this.hasPart(roomType)) return false;
		this.partsRemaining--;
		return true;
	}

	public startBreak(roomType:RoomType): boolean {
		let room = this.rooms[roomType];
		if(room.isBroken) return false; // Only one node can be broken in a room at a time
		let nodes = room.nodes;
		let i = Math.floor(Math.random()*nodes.length);
		let node = nodes[i];
		node.isBroken = true;
		room.isBroken = true;
		this.game.net.broadcastEvent('nodeState', 'sparks', {'left': node.left, 'top': node.top, 'state': node.isBroken}, 'robotics');
		return true;
	}

	private repairNode(node:Node, withPart:boolean): boolean {
		let room = this.rooms[node.room];
		if(withPart) {
			if(!this.consumePart(node.room)) return false;
			room.condition = 1;
		} else {
			room.condition *= 0.8;
			console.log("without part", room.condition);
		}
		node.isBroken = false;
		room.isBroken = false;
		this.game.net.broadcastEvent('nodeState', 'sparks', {'left': node.left, 'top': node.top, 'state': node.isBroken}, 'robotics');
		return true;
	}
}

interface ShipType {
	numRobots: number;
	numParts: number;
	nodes: [number, number, RoomType, string][];
}
class ShipTypes {
	static ship1 = <ShipType>{
		numRobots: 3,
		numParts: 3,
		nodes: [
			// middle
			[3, 4, RoomType.Engine, 'es'],
			[3, 5, RoomType.Engine, 'en'],
			[4, 4, RoomType.Generator, 'esw'],
			[4, 5, RoomType.Generator, 'enw'],
			[5, 4, RoomType.Generator, 'esw'],
			[5, 5, RoomType.Generator, 'enw'],
			[6, 4, RoomType.None, 'esw'],
			[6, 5, RoomType.None, 'enw'],
			[7, 4, RoomType.Robotics, 'nesw'],
			[7, 5, RoomType.Robotics, 'nesw'],
			[8, 4, RoomType.Robotics, 'nesw'],
			[8, 5, RoomType.Robotics, 'nesw'],
			[9, 4, RoomType.None, 'nesw'],
			[9, 5, RoomType.None, 'nesw'],
			[10, 4, RoomType.None, 'nesw'],
			[10, 5, RoomType.None, 'nesw'],
			[11, 4, RoomType.Cockpit, 'esw'],
			[11, 5, RoomType.Cockpit, 'new'],
			[12, 4, RoomType.Cockpit, 'sw'],
			[12, 5, RoomType.Cockpit, 'nw'],

			// top
			[7, 2, RoomType.Navigation, 'es'],
			[7, 3, RoomType.Navigation, 'nes'],
			[8, 2, RoomType.Navigation, 'sw'],
			[8, 3, RoomType.Navigation, 'nsw'],
			[9, 2, RoomType.Weapons, 'es'],
			[9, 3, RoomType.Weapons, 'nes'],
			[10, 2, RoomType.Weapons, 'sw'],
			[10, 3, RoomType.Weapons, 'nsw'],

			// bottom
			[7, 6, RoomType.Shields, 'nes'],
			[7, 7, RoomType.Shields, 'ne'],
			[8, 6, RoomType.Shields, 'nsw'],
			[8, 7, RoomType.Shields, 'nw'],
			[9, 6, RoomType.Weapons, 'nes'],
			[9, 7, RoomType.Weapons, 'ne'],
			[10, 6, RoomType.Weapons, 'nsw'],
			[10, 7, RoomType.Weapons, 'nw'],
		]
	};
}

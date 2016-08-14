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
}

export class ShipNodes {
	private game: Game;
	private nodes: {[XxY: string]: Node} = {};
	private nodesByRoom: {[room: number]: Node[]} = {};
	public robots: Robot[] = [];
	private grid;
	private finder;

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

		let grid = ShipNodes[layout];
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
			if(!this.nodesByRoom[node.room]) this.nodesByRoom[node.room] = [];
			this.nodesByRoom[node.room].push(node);
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
		for (let node of this.nodesByRoom[RoomType.Robotics]) {
			this.robots.push(<Robot>{'left':node.left, 'top':node.top, 'id': this.robots.length});
			if (--num <= 0) break;
		}
	}

	static ship1 = [
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
	];

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
					if(node.onFire) {
						connection.sendEvent('nodeFire', {'left': node.left, 'top': node.top, 'onFire': node.onFire});
					}
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
		switch(action) {
			case 'extinguish':
				let node = this.nodes[robot.left+'x'+robot.top];
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
		}
	}

	public startFire(roomType:RoomType): boolean {
		let nodes = this.nodesByRoom[roomType].slice();
		while(nodes.length) {
			let i = Math.floor(Math.random()*nodes.length);
			let node = nodes[i];
			if(node.onFire) {
				nodes.splice(i, 1);
				continue;
			}
			node.onFire = true;
			this.game.net.broadcastEvent('nodeFire', '', {'left': node.left, 'top': node.top, 'onFire': node.onFire}, 'robotics');
			return true;
		}
		return false;
	}

	public stopFire(node:Node): void {
		node.onFire = false;
		this.game.net.broadcastEvent('nodeFire', '', {'left': node.left, 'top': node.top, 'onFire': node.onFire}, 'robotics');
	}
}

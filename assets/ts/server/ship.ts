import {NetPacket} from "./ServerNet";
import {Game} from "./Game";
enum RoomType {
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
}

export class ShipNodes {
	private game: Game;
	private nodes: {[XxY: string]: Node} = {};
	public robots: Robot[] = [];

	constructor(game: Game, layout: string) {
		this.game = game;

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
			this.nodes[node.top + 'x' + node.left] = node;
		}
	}

	createRobots(num: number)
	{
		for (let node_pos in this.nodes) {
			let node = this.nodes[node_pos];
			if (node.room == RoomType.Robotics) {
				this.robots.push(<Robot>{'left':node.left, 'top':node.top, 'id': this.robots.length});
				if (--num <= 0) break;
			}
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
		}
	}

	public moveRobot(id:number, coord) {
		var robot = this.robots[id];
		if(!robot) return;
		robot.left = coord[0];
		robot.top = coord[1];
		this.game.net.broadcast({'event': 'robots', 'id': id, 'value': [robot]}, 'robotics');
	}
}

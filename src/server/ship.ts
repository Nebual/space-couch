import { NetPacket, Connection } from './ServerNet';
import { Game } from './Game';
import { AStarFinder, Grid } from 'pathfinding';
import { Entity } from 'ecsy';
import {
	deserializeCompValue,
	EmissionDetector,
	Position,
	PowerBuffer,
	PowerConsumer,
	PowerProducer,
	RenderableInterior,
	serializeComponentValue,
	ShipPosition,
	SyncId,
	ThrustSource,
} from './Components';
import { objectMap } from './commonUtil';
const fs = require('fs');
const path = require('path');
const PF = require('pathfinding');

export enum RoomType {
	None,
	Engine,
	Generator,
	Weapons,
	Robotics,
	Shields,
	Navigation,
	Cockpit,
}
export enum TileSpawnerType {
	Robot = 'robo-spawner',
	Reactor = 'reactor',
	ShieldEmitter = 'shield-emitter',
	Thruster = 'thruster',
	Comms = 'comms',
	Gun = 'gun',
}

export interface Robot {
	id: number;
	left: number;
	top: number;
	carrying: string | null;
	connecting: string | null;
}

interface Node {
	top: number;
	left: number;

	// (only used by old hardcoded model)
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
	public toJSON() {
		return {
			condition: this.condition,
			isBroken: this.isBroken,
		};
	}
	public applyJSON(obj) {
		if (obj.condition !== undefined) this.condition = obj.condition;
		if (obj.isBroken !== undefined) this.isBroken = obj.isBroken;
	}
}

export class ShipNodes {
	private game: Game;
	private shipType: string;
	private nodes: { [XxY: string]: Node } = {};
	private rooms: { [room: number]: Room } = {};
	public robots: Robot[] = [];
	private grid: Grid;
	private finder: AStarFinder;
	private partsRemaining: number = 0;
	private shipTileData: any;
	private spawnerTiles: { [type: string]: { x: number; y: number }[] };
	public entities: { [key: string]: Entity } = {};

	constructor(game: Game, layout: string) {
		this.game = game;
		this.shipType = layout;

		const jsonFile = `public/images/ships/${layout}.json`;
		if (fs.existsSync(jsonFile)) {
			this.loadTiledCollisionsGrid(jsonFile);
		} else {
			this.initializeHardcodedGrid(layout);
		}
	}

	private loadTiledCollisionsGrid(jsonFile) {
		this.shipTileData = JSON.parse(fs.readFileSync(jsonFile));
		const walkable = this.shipTileData.layers.find(
			({ name }) => name === 'walkable'
		);

		// Create a matrix that's entirely unwalkable by default
		// 2x as large as our grid size, so there's odd "wall" nodes between each even grid cell
		this.grid = new PF.Grid(
			Array(walkable.height * 2).fill(Array(walkable.width * 2).fill(1))
		);
		this.finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
		});

		const cellIsWalkable = (x, y) =>
			x > 0 && y > 0 && walkable.data[y * walkable.width + x] > 0;
		for (let y = 0; y < walkable.height; y++) {
			for (let x = 0; x < walkable.width; x++) {
				if (!cellIsWalkable(x, y)) {
					continue;
				}
				this.nodes[x + 'x' + y] = {
					left: x,
					top: y,
				} as Node;
				const subX = x * 2;
				const subY = y * 2;
				this.grid.setWalkableAt(subX, subY, true);
				if (cellIsWalkable(x, y + 1)) {
					this.grid.setWalkableAt(subX, subY + 1, true);
				}
				if (cellIsWalkable(x - 1, y)) {
					this.grid.setWalkableAt(subX - 1, subY, true);
				}

				// Kinda a hack, but open up nodes in the middle of the room too
				if (
					cellIsWalkable(x, y - 1) &&
					cellIsWalkable(x - 1, y) &&
					this.grid.isWalkableAt(subX - 1, subY - 2)
				) {
					this.grid.setWalkableAt(subX - 1, subY - 1, true);
				}
				if (
					cellIsWalkable(x, y + 1) &&
					cellIsWalkable(x - 1, y) &&
					this.grid.isWalkableAt(subX - 1, subY + 2)
				) {
					this.grid.setWalkableAt(subX - 1, subY + 1, true);
				}
			}
		}

		this.debug_grid();

		const tileMetadata = {};
		for (let { firstgid, source } of this.shipTileData.tilesets) {
			const tileset = JSON.parse(
				fs.readFileSync(path.join(jsonFile, '../', source))
			);
			for (let { id, type } of tileset.tiles) {
				tileMetadata[firstgid + id] = { type };
			}
		}
		this.spawnerTiles = {};
		const spawnerLayer = this.shipTileData.layers.find(
			({ name }) => name === 'module-spawners'
		);
		spawnerLayer.data.forEach((tileId, index) => {
			if (!tileId || !tileMetadata.hasOwnProperty(tileId)) {
				return;
			}
			const x = index % spawnerLayer.width;
			const y = Math.floor(index / spawnerLayer.width);
			const type = tileMetadata[tileId].type;
			if (!this.spawnerTiles[type]) {
				this.spawnerTiles[type] = [];
			}
			this.spawnerTiles[type].push({ x, y });
		});
		this.partsRemaining = 3;
	}
	private initializeHardcodedGrid(layout) {
		let shipType = ShipTypes[layout];
		let nodes = shipType.nodes.map(
			([left, top, room, openings]) =>
				({
					left,
					top,
					room,
					north: openings.includes('n'),
					east: openings.includes('e'),
					south: openings.includes('s'),
					west: openings.includes('w'),
				} as Node)
		);

		const maxGridX = Math.max(...nodes.map(n => n.left), 0) + 1;
		const maxGridY = Math.max(...nodes.map(n => n.top), 0) + 1;

		// Create a matrix that's entirely unwalkable by default
		// 2x as large as our grid size, so there's odd "wall" nodes between each even grid cell
		let rows: number[][] = Array(maxGridY * 2).fill(
			Array(maxGridX * 2).fill(1)
		);
		this.grid = new PF.Grid(rows);
		this.finder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
		});
		nodes.forEach(node => {
			this.nodes[node.left + 'x' + node.top] = node;
			if (!this.rooms[node.room]) {
				this.rooms[node.room] = new Room(node.room);
			}
			this.rooms[node.room].nodes.push(node);

			const subX = node.left * 2;
			const subY = node.top * 2;
			this.grid.setWalkableAt(subX, subY, true);
			if (node.south) this.grid.setWalkableAt(subX, subY + 1, true);
			if (node.west) this.grid.setWalkableAt(subX - 1, subY, true);
			// Kinda a hack, but open up nodes in the middle of the room too
			if (
				node.north &&
				node.west &&
				this.grid.isWalkableAt(subX - 1, subY - 2)
			) {
				this.grid.setWalkableAt(subX - 1, subY - 1, true);
			}
			if (
				node.south &&
				node.west &&
				this.grid.isWalkableAt(subX - 1, subY + 2)
			) {
				this.grid.setWalkableAt(subX - 1, subY + 1, true);
			}
		});
		this.debug_grid();
		this.createRobots(shipType.numRobots);
		this.partsRemaining = shipType.numParts;
	}

	public toJSON() {
		return {
			shipType: this.shipType,
			robots: this.robots,
			rooms: this.rooms,
			_entities: objectMap(this.entities, value =>
				objectMap(value.getComponents(), component =>
					Object.entries(component).reduce(
						(savedProps, [key, value]) => {
							savedProps[key] = serializeComponentValue(value);
							return savedProps;
						},
						{}
					)
				)
			),
		};
	}
	public applyJSON(obj) {
		if (obj.robots !== undefined) this.robots = obj.robots;
		if (obj.rooms !== undefined) {
			for (let room_id in obj.rooms) {
				if (!this.rooms[room_id]) {
					continue;
				}
				this.rooms[room_id].applyJSON(obj.rooms[room_id]);
			}
		}
		if (obj._entities !== undefined) {
			const savedShipEntities = obj._entities as {
				[entKey: string]: {
					[compId: string]: { [propKey: string]: any };
				};
			};
			Object.entries(savedShipEntities).forEach(([entKey, comps]) => {
				const components = this.entities[entKey].getComponents();
				Object.entries(comps).forEach(([compId, compVals]) => {
					const component = components[compId];
					Object.entries(compVals).forEach(([propKey, propValue]) => {
						if (!component.hasOwnProperty(propKey)) {
							return;
						}
						component[propKey] = deserializeCompValue(
							this.entities,
							propValue
						);
					});
				});
			});
		}
	}

	public debug_grid(grid?: Grid) {
		if (!grid) grid = this.grid;
		let s = '';
		for (let row of (grid as any).nodes) {
			for (let cell of row) {
				s += cell.walkable ? ' ' : 'X';
			}
			s += '\n';
		}
		console.log(s);
	}

	public getNode(x: number, y: number): Node {
		return this.nodes[`${x}x${y}`];
	}

	public loadDefaultComponents() {
		(this.spawnerTiles[TileSpawnerType.Robot] || []).forEach(({ x, y }) => {
			this.robots.push({
				left: x,
				top: y,
				id: this.robots.length,
			} as Robot);
		});

		const reactorPos = this.spawnerTiles[TileSpawnerType.Reactor][0];
		this.entities.reactor = this.game.world
			.createEntity()
			.addComponent(ShipPosition, reactorPos)
			.addComponent(SyncId, { value: 'reactor' })
			.addComponent(RenderableInterior, { image: '/images/reactor.png' })
			.addComponent(PowerBuffer, {
				rate: 0,
				current: 1000,
				max: 1000,
			})
			.addComponent(PowerProducer, { rate: 1000, maxRate: 1000 });

		const detectorPos = this.spawnerTiles[TileSpawnerType.Comms][0];
		this.entities.heatDetector = this.game.world
			.createEntity()
			.addComponent(Position) // todo: ship components shouldn't have a solar position
			.addComponent(ShipPosition, detectorPos)
			.addComponent(PowerBuffer, {
				max: 100,
				rate: 20,
				maxRate: 40,
				sources: [this.entities.reactor],
			})
			.addComponent(SyncId, { value: 'heatDetector' })
			.addComponent(RenderableInterior, { image: '/images/reactor.png' }) // todo
			.addComponent(PowerConsumer, { rate: 20 })
			.addComponent(EmissionDetector, {
				type: 'heat',
			});

		this.spawnerTiles[TileSpawnerType.Thruster].forEach((pos, index) => {
			const syncId = 'thruster_' + index;
			this.entities[syncId] = this.game.world
				.createEntity()
				.addComponent(ShipPosition, pos)
				.addComponent(PowerBuffer, {
					max: 200,
					rate: 40,
					maxRate: 80,
					sources: [this.entities.reactor],
				})
				.addComponent(SyncId, { value: syncId })
				.addComponent(RenderableInterior, {
					image: '/images/thruster.png',
					className: 'thruster',
				})
				.addComponent(PowerConsumer, { rate: 20 })
				.addComponent(ThrustSource);
		});
	}

	update(delta: number, time: number) {
		let reactor = this.entities.reactor;
		if (reactor.getComponent(PowerBuffer).current < 1) {
			this.game.setPlayerLights(false);
		}
	}

	setReactorRate(rate: number) {
		const ent = this.entities.reactor;
		const powerProducer = ent.getMutableComponent(PowerProducer);
		powerProducer.rate = rate * powerProducer.maxRate;
	}
	setBufferRate(syncId: string, rate: number) {
		const ent = this.entities[syncId];
		const powerBuffer = ent.getMutableComponent(PowerBuffer);
		powerBuffer.rate = rate * powerBuffer.maxRate;
	}

	createRobots(num: number) {
		// deprecated, not used in Tiled ships
		for (let node of this.rooms[RoomType.Robotics].nodes) {
			this.robots.push(<Robot>{
				left: node.left,
				top: node.top,
				id: this.robots.length,
			});
			if (--num <= 0) break;
		}
	}

	public onMessage(msg: NetPacket) {
		switch (msg.event) {
			case 'moveRobot':
				this.moveRobot(<number>msg.id, msg.value);
				break;
			case 'robotAction':
				this.robotAction(<number>msg.id, msg.value);
		}
	}

	public initConnection(connection: Connection) {
		connection.sendEvent('shipId', this.shipType);
		switch (connection.role) {
			case 'robotics': {
				connection.sendEvent('robots', this.robots);
				for (let node_id in this.nodes) {
					let node = this.nodes[node_id];
					if (node.onFire)
						connection.send({
							event: 'nodeState',
							id: 'fire',
							value: {
								left: node.left,
								top: node.top,
								state: node.onFire,
							},
						});
					if (node.isBroken)
						connection.send({
							event: 'nodeState',
							id: 'sparks',
							value: {
								left: node.left,
								top: node.top,
								state: node.isBroken,
							},
						});
				}
				for (let ent of Object.values(this.entities)) {
					this.sendSubsystemState(ent, connection);
				}
				break;
			}
		}
	}

	public sendSubsystemState(ent: Entity, connection?: Connection) {
		const syncId = ent.getComponent(SyncId).value;
		if (!syncId) {
			return;
		}

		const buffer = ent.getComponent(PowerBuffer);
		const renderable = ent.getComponent(RenderableInterior);
		const packet = {
			event: 'subsystemState',
			id: syncId,
			value: {
				id: syncId,
				position: ent.getComponent(ShipPosition),
				sources: buffer?.sources.map(
					sourceEnt => sourceEnt.getComponent(SyncId)?.value
				),
				image: renderable?.image,
				className: `${renderable?.className} ${
					buffer?.installed === false ? 'hidden' : '' // null implies has no Consumer, eg. reactor
				}`,
			},
		};
		if (connection) {
			connection.send(packet);
		} else {
			this.game.net.broadcast(packet, 'robotics');
		}
	}

	public sendRobotsState() {
		this.game.net.broadcast(
			{
				event: 'robots',
				value: this.robots,
			},
			'robotics'
		);
	}

	public moveRobot(id: number, coord) {
		let robot = this.robots[id];
		let node = this.getNode(coord[0], coord[1]);
		if (
			!robot ||
			!node ||
			(coord[0] === robot.left && coord[1] === robot.top)
		)
			return;

		let path = this.finder.findPath(
			robot.left * 2,
			robot.top * 2,
			coord[0] * 2,
			coord[1] * 2,
			this.grid.clone()
		);
		path = PF.Util.compressPath(path);
		for (let i = 0; i < path.length; i++) {
			path[i][0] /= 2;
			path[i][1] /= 2;
		}
		robot.left = coord[0];
		robot.top = coord[1];
		this.game.net.broadcast(
			{ event: 'robotPath', id: id, value: path },
			'robotics'
		);
	}

	private robotAction(robot_id: number, action: string) {
		let robot = this.robots[robot_id];
		let node = this.nodes[robot.left + 'x' + robot.top];
		const matchesRoboPos = ent => {
			const pos = ent.getComponent(ShipPosition);
			return pos.x === robot.left && pos.y === robot.top;
		};
		switch (action) {
			case 'extinguish':
				if (!node.onFire) break;

				this.game.setRoleState('robotics', 'robot_' + robot_id, true);
				setTimeout(() => {
					let node = this.nodes[robot.left + 'x' + robot.top];
					if (node.onFire) {
						this.stopFire(node);
					}
					this.game.setRoleState(
						'robotics',
						'robot_' + robot_id,
						false
					);
				}, 5000);
				break;
			case 'repair':
			case 'replace':
				if (!node.isBroken) break;
				if (action === 'repair' && !this.hasPart(node.room)) break;

				this.game.setRoleState('robotics', 'robot_' + robot_id, true);
				setTimeout(
					() => {
						let node = this.nodes[robot.left + 'x' + robot.top];
						if (node.isBroken) {
							this.repairNode(node, action === 'replace');
						}
						this.game.setRoleState(
							'robotics',
							'robot_' + robot_id,
							false
						);
					},
					action === 'repair' ? 5000 : 15000
				);
				break;
			case 'pickup': {
				const ent = Object.values(this.entities).find(matchesRoboPos);
				if (!ent || !ent.hasComponent(PowerBuffer)) {
					console.warn(
						'Robot Pickup failed: nothing in',
						robot.left,
						robot.top,
						ent?.getComponent(SyncId)?.value
					);
					return;
				}
				ent.getMutableComponent(PowerBuffer).installed = false;
				ent.getMutableComponent(ShipPosition).x = -1;
				robot.carrying = ent.getComponent(SyncId).value;
				this.sendRobotsState();
				this.sendSubsystemState(ent);
				break;
			}
			case 'install': {
				const ent = Object.values(this.entities).find(matchesRoboPos);
				if (ent) {
					console.warn(
						'Robot install failed: ent in',
						robot.left,
						robot.top,
						ent.getComponent(SyncId).value
					);
					return;
				}
				const carriedSubsystem = this.entities[robot.carrying || ''];
				if (!carriedSubsystem) {
					return;
				}
				carriedSubsystem.getMutableComponent(
					PowerBuffer
				).installed = true;
				const pos = carriedSubsystem.getMutableComponent(ShipPosition);
				pos.x = robot.left;
				pos.y = robot.top;
				robot.carrying = null;
				this.sendRobotsState();
				this.sendSubsystemState(carriedSubsystem);
				break;
			}
			case 'connect': {
				const ent = Object.values(this.entities).find(matchesRoboPos);
				this.handleWiringConnect(robot, ent);
				break;
			}
		}
	}

	handleWiringConnect(robot, ent: Entity | undefined) {
		if (!robot.connecting && ent && ent.hasComponent(PowerBuffer)) {
			// start connecting
			robot.connecting = ent.getComponent(SyncId).value;
			this.sendRobotsState();
		} else if (robot.connecting) {
			const entStart = this.entities[robot.connecting];
			robot.connecting = null;
			this.sendRobotsState();

			if (ent === entStart) {
				// connect to self = unplug
				ent.getMutableComponent(PowerBuffer).sources = [];
				this.sendSubsystemState(ent);
				return;
			}
			if (ent && entStart && ent.hasComponent(PowerBuffer)) {
				let sink = entStart; // typically, plug device -> wall
				let source = ent;
				if (entStart.hasComponent(PowerConsumer)) {
					// device -> socket
					sink = entStart;
					source = ent;
				} else if (ent.hasComponent(PowerConsumer)) {
					// socket -> device (flip around)
					sink = ent;
					source = entStart;
				} else if (entStart.hasComponent(PowerProducer)) {
					sink = ent;
					source = entStart;
				} else {
					// socket -> upstream socket or reactor
				}
				sink.getMutableComponent(PowerBuffer).sources = [source];
				this.sendSubsystemState(sink);
			}
		}
	}

	public startFire(roomType: RoomType): boolean {
		if (!this.rooms[roomType]) {
			return false; // todo: new Tiled ships don't have rooms...
		}
		let nodes = this.rooms[roomType].nodes.slice();
		while (nodes.length) {
			let i = Math.floor(Math.random() * nodes.length);
			let node = nodes[i];
			if (node.onFire) {
				nodes.splice(i, 1);
				continue;
			}
			node.onFire = true;
			this.game.net.broadcastEvent(
				'nodeState',
				'fire',
				{ left: node.left, top: node.top, state: node.onFire },
				'robotics'
			);
			return true;
		}
		return false;
	}

	public stopFire(node: Node): void {
		node.onFire = false;
		this.game.net.broadcastEvent(
			'nodeState',
			'fire',
			{ left: node.left, top: node.top, state: node.onFire },
			'robotics'
		);
	}

	private hasPart(roomType: RoomType): boolean {
		// todo: different rooms might need different parts?
		return this.partsRemaining > 0;
	}

	private consumePart(roomType: RoomType): boolean {
		if (!this.hasPart(roomType)) return false;
		this.partsRemaining--;
		return true;
	}

	public startBreak(roomType: RoomType): boolean {
		let room = this.rooms[roomType];
		if (!room) {
			return false; // todo: new Tiled ships don't have rooms...
		}
		if (room.isBroken) return false; // Only one node can be broken in a room at a time
		let nodes = room.nodes;
		let i = Math.floor(Math.random() * nodes.length);
		let node = nodes[i];
		node.isBroken = true;
		room.isBroken = true;
		this.game.net.broadcastEvent(
			'nodeState',
			'sparks',
			{ left: node.left, top: node.top, state: node.isBroken },
			'robotics'
		);
		return true;
	}

	private repairNode(node: Node, withPart: boolean): boolean {
		let room = this.rooms[node.room];
		if (!room) {
			return false; // todo: new Tiled ships don't have rooms...
		}
		if (withPart) {
			if (!this.consumePart(node.room)) return false;
			room.condition = 1;
		} else {
			room.condition *= 0.8;
			console.log('without part', room.condition);
		}
		node.isBroken = false;
		room.isBroken = false;
		this.game.net.broadcastEvent(
			'nodeState',
			'sparks',
			{ left: node.left, top: node.top, state: node.isBroken },
			'robotics'
		);
		return true;
	}
}

interface ShipType {
	numRobots: number;
	numParts: number;
	nodes: [number, number, RoomType, string][];
}

const ShipTypes: { [shipId: string]: ShipType } = {
	ship1: {
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
		],
	},
};

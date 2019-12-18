import fs from 'fs';
import path from 'path';
import { Entity, World } from 'ecsy';
import { performance } from 'perf_hooks';

import DSON from './dson2.js';
import { objectMap } from './commonUtil';
import { ServerNet, Connection, NetPacket } from './ServerNet';
import { ShipNodes, RoomType } from './ship';
import {
	Position,
	Velocity,
	Emission,
	EmissionDetector,
	PowerBuffer,
	PowerConsumer,
	ShipPosition,
	PowerProducer,
	SyncId,
	serializeComponentValue,
	deserializeCompValue,
	GravitationalMass,
} from './Components';
import {
	EmissionDetectorSystem,
	EmissionSystem,
	GravitationSystem,
	MovableSystem,
	PowerConsumptionSystem,
	PowerFlowSystem,
	PowerProductionSystem,
} from './Systems';

export class GameWorld extends World {
	public getNet: () => ServerNet;
	constructor(getNet: () => ServerNet) {
		super();
		this.getNet = getNet;
	}
}

export class Game {
	public lights_on = true;
	public paused = false;
	private state = {
		captain: {},
		engineer: {
			power1: 100,
			power4: 50,
			main_power_system: true,
		},
		navigator: {},
		robotics: {},
		radar: {},
		weapons: {},
	};
	public ship: ShipNodes;
	public net: ServerNet;
	public world: GameWorld;
	private worldTimer: NodeJS.Timeout;
	private shipEntities: { [key: string]: Entity } = {};
	private lastTime: number;
	private originTime: number;

	constructor(originTime?: number) {
		this.originTime = originTime || 0;
		this.registerWorld();
		this.addWorldTestEntities();
	}

	private registerWorld() {
		this.world = new GameWorld(() => this.net)
			.registerComponent(Position)
			.registerComponent(Velocity)
			.registerComponent(Emission)
			.registerSystem(GravitationSystem)
			.registerSystem(MovableSystem)
			.registerSystem(EmissionSystem)
			.registerSystem(PowerProductionSystem)
			.registerSystem(PowerFlowSystem)
			.registerSystem(PowerConsumptionSystem)
			.registerSystem(EmissionDetectorSystem);

		this.lastTime = performance.now() / 1000 + this.originTime;
		this.worldTimer = setInterval(() => {
			let time = performance.now() / 1000 + this.originTime;
			let delta = time - this.lastTime;
			this.lastTime = time;

			// Run all the systems
			this.world.execute(delta, time);

			// dirty one-offs that should probably become systems one day
			let reactor = this.shipEntities.reactor;
			if (reactor.getComponent(PowerBuffer).current < 1) {
				this.setPlayerLights(false);
			}
		}, 100);
	}
	public shutdown() {
		clearInterval(this.worldTimer);
	}

	private addWorldTestEntities() {
		// a random test heat emission: travelling eastward
		this.world
			.createEntity()
			.addComponent(Position, { x: -200, y: 10 })
			.addComponent(Velocity, { x: 10 })
			.addComponent(Emission, {
				type: 'heat',
				strength: 70,
				strengthRate: -1,
			});

		this.world
			.createEntity()
			.addComponent(SyncId, { value: 'capturedSatellite' })
			.addComponent(Position, { x: 100, y: 10 })
			.addComponent(Velocity, { x: 6 })
			.addComponent(Emission, {
				type: 'heat',
				strength: 50,
				strengthRate: 0,
			});

		this.world
			.createEntity()
			.addComponent(SyncId, { value: 'planetA' })
			.addComponent(Position, { x: 200, y: 50 })
			.addComponent(GravitationalMass, { gravitons: 5000 });

		this.shipEntities.reactor = this.world
			.createEntity()
			.addComponent(ShipPosition, { x: 4, y: 4 })
			.addComponent(SyncId, { value: 'reactor' })
			.addComponent(PowerBuffer, {
				rate: 0,
				current: 1000,
				max: 1000,
			})
			.addComponent(PowerProducer, { rate: 1000, maxRate: 1000 });
		this.shipEntities.heatDetector = this.world
			.createEntity()
			.addComponent(Position) // todo: ship components shouldn't have a solar position
			.addComponent(ShipPosition, { x: 7, y: 2 })
			.addComponent(PowerBuffer, {
				max: 100,
				rate: 20,
				maxRate: 40,
				sources: [this.shipEntities.reactor],
			})
			.addComponent(SyncId, { value: 'heatDetector' })
			.addComponent(PowerConsumer, { rate: 20 })
			.addComponent(EmissionDetector, {
				type: 'heat',
			});
	}

	public toJSON() {
		return {
			originTime: this.lastTime,
			lights_on: this.lights_on,
			paused: this.paused,
			state: this.state,
			_ship: this.ship.toJSON(),
			_shipEntities: objectMap(this.shipEntities, value =>
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
	public static fromJSON(obj): Game {
		let game = new this(obj.originTime);

		for (let key in obj) {
			if (game.hasOwnProperty(key)) {
				if (game[key] instanceof Object) {
					Object.assign(game[key], obj[key]); // caution: not a deep copy
				} else {
					game[key] = obj[key];
				}
			}
		}
		let shipType = 'ship1';
		if (obj._ship && obj._ship.shipType) shipType = obj._ship.shipType;
		game.initShip(shipType);

		if (obj._ship !== undefined) game.ship.applyJSON(obj._ship);
		if (obj._shipEntities !== undefined) {
			const savedShipEntities = obj._shipEntities as {
				[entKey: string]: {
					[compId: string]: { [propKey: string]: any };
				};
			};
			Object.entries(savedShipEntities).forEach(([entKey, comps]) => {
				const components = game.shipEntities[entKey].getComponents();
				Object.entries(comps).forEach(([compId, compVals]) => {
					const component = components[compId];
					Object.entries(compVals).forEach(([propKey, propValue]) => {
						if (!component.hasOwnProperty(propKey)) {
							return;
						}
						component[propKey] = deserializeCompValue(
							game.shipEntities,
							propValue
						);
					});
				});
			});
		}
		return game;
	}

	public save(saveName: string = 'last_save.dson') {
		const fileName = path.join('saves', saveName);
		fs.mkdirSync('saves', { recursive: true });
		fs.writeFileSync(fileName, DSON.stringify(this, null, '  '));
	}
	public static load(saveName: string): Game {
		const fileName = path.join('saves', saveName);
		let json = DSON.parse(fs.readFileSync(fileName, 'utf8'));
		return Game.fromJSON(json);
	}

	public initConnection(connection: Connection) {
		this.ship.initConnection(connection);
		connection.sendEvent('lights_on', this.lights_on);
		connection.sendEvent('pause', this.paused);

		let role_state = this.getRoleStates(connection.role);
		for (let index of Object.keys(role_state)) {
			connection.send({
				event: 'state',
				id: index,
				value: role_state[index],
			});
		}
	}

	public setRoleState(
		role: Role,
		id: string,
		value,
		connection?: Connection
	) {
		this.state[role][id] = value;
		this.net.broadcast(
			{ event: 'state', id: id, value: value },
			role,
			connection
		);

		switch (id) {
			case 'main_power_system':
				this.lights_on = value;
				this.net.broadcast({
					event: 'lights_on',
					value: this.lights_on,
				});
				break;
			case 'flush_gravity':
				this.net.broadcast({ event: 'vibrate', value: 300 });
				break;
			case 'pause':
				this.paused = value;
				this.net.broadcast({ event: 'pause', value: this.paused });
				break;
			case 'start_generator_fire':
				this.ship.startFire(RoomType.Generator);
				break;
			case 'break_shields':
				this.ship.startBreak(RoomType.Shields);
				break;
			case 'power1': {
				const ent = this.shipEntities.reactor;
				const powerProducer = ent.getMutableComponent(PowerProducer);
				powerProducer.rate = (value / 100) * powerProducer.maxRate;
				break;
			}
			case 'power2':
				if (value > 90) {
					this.setPlayerLights(false);
				}
				break;
			case 'power4': {
				const ent = this.shipEntities.heatDetector;
				const powerBuffer = ent.getMutableComponent(PowerBuffer);
				powerBuffer.rate = (value / 100) * powerBuffer.maxRate;
				break;
			}
		}
	}

	private setPlayerLights(value) {
		this.setRoleState('engineer', 'main_power_system', value);
	}

	public getRoleState(role, id) {
		return this.state[role][id];
	}
	private getRoleStates(role) {
		return this.state[role] || {};
	}

	public initShip(shipName: string) {
		this.ship = new ShipNodes(this, shipName);
	}

	public onMessage(connection: Connection, msg: NetPacket) {
		switch (msg.event) {
			case 'changeRole':
				connection.role = msg.value;
				this.initConnection(connection);
				break;
			case 'state':
				console.log('They set ' + msg.id + ' to ' + msg.value);
				this.setRoleState(
					connection.role,
					msg.id as string,
					msg.value,
					connection
				);
				break;
			case 'changeShip':
				this.initShip(msg.value);
				break;
		}
		this.ship.onMessage(msg);
	}
}

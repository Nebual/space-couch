import fs from 'fs';
import path from 'path';
import { Entity, World } from 'ecsy';
import { performance } from 'perf_hooks';

import DSON from './dson2.js';
import { ServerNet, Connection, NetPacket } from './ServerNet';
import { ShipNodes, RoomType } from './ship';
import {
	Position,
	Velocity,
	Emission,
	SyncId,
	GravitationalMass,
	PowerBuffer,
	ThrustSource,
	ShieldSource,
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
	public getShip: () => ShipNodes;
	constructor(getNet: () => ServerNet, getShip: () => ShipNodes) {
		super();
		this.getNet = getNet;
		this.getShip = getShip;
	}
}

export class Game {
	public lights_on = true;
	public paused = false;
	private state = {
		captain: {},
		engineer: {
			power1: 100,
			'powerBufferSlider:shields': 50,
			'powerBufferSlider:thrusters': 50,
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
	private lastTime: number;
	private originTime: number;

	constructor(originTime?: number) {
		this.originTime = originTime || 0;
		this.registerWorld();
		this.addWorldTestEntities();
	}

	private registerWorld() {
		this.world = new GameWorld(
			() => this.net,
			() => this.ship
		)
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
			this.ship.update(delta, time);
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
	}

	public toJSON() {
		return {
			originTime: this.lastTime,
			lights_on: this.lights_on,
			paused: this.paused,
			state: this.state,
			_ship: this.ship.toJSON(),
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
		let shipType = 'ship2';
		if (obj._ship && obj._ship.shipType) shipType = obj._ship.shipType;
		game.initShip(shipType);

		if (obj._ship !== undefined) game.ship.applyJSON(obj._ship);
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
			case 'power1':
				this.ship.setReactorRate(value / 100);
				break;
			case 'powerBufferSlider:shields': {
				const rate = value / 100;
				(this.world as any).entityManager
					.queryComponents([ShieldSource])
					.entities.forEach(ent => {
						const powerBuffer = ent.getMutableComponent(
							PowerBuffer
						);
						powerBuffer.rate = rate * powerBuffer.maxRate;
					});
				break;
			}
			case 'powerBufferSlider:thrusters':
				const rate = value / 100;
				(this.world as any).entityManager
					.queryComponents([ThrustSource])
					.entities.forEach(ent => {
						const powerBuffer = ent.getMutableComponent(
							PowerBuffer
						);
						powerBuffer.rate = rate * powerBuffer.maxRate;
					});
				break;
			case 'power4':
				this.ship.setBufferRate('heatDetector', value / 100);
				break;
		}
	}

	public setPlayerLights(value) {
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
		this.ship.loadDefaultComponents();
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
			case 'debugPositions':
				connection.sendEvent(
					'debugPositions',
					(this.world as any).entityManager
						.queryComponents([Position])
						.entities.map(ent => ({
							name: ent.getComponent(SyncId)?.value || ent.id,
							position: ent.getComponent(Position),
							velocity: ent.getComponent(Velocity),
							gravitons: ent.getComponent(GravitationalMass)
								?.gravitons,
						}))
				);
				break;
		}
		this.ship.onMessage(msg);
	}
}

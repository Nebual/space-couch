import fs from 'fs';
import path from 'path';
import { World } from 'ecsy';
import { performance } from 'perf_hooks';

import DSON from './dson2.js';
import { ServerNet, Connection, NetPacket } from './ServerNet';
import { ShipNodes, RoomType } from './ship';
import { Position, Velocity, Emission, EmissionDetector } from './Components';
import {
	EmissionDetectorSystem,
	EmissionSystem,
	MovableSystem,
} from './Systems';

export class Game {
	public lights_on = true;
	public paused = false;
	private state = {
		captain: {},
		engineer: {
			main_power_system: true,
		},
		navigator: {},
		robotics: {},
		radar: {},
		weapons: {},
	};
	public ship: ShipNodes;
	public net: ServerNet;
	public world: World;
	private worldTimer: NodeJS.Timeout;

	constructor() {
		this.registerWorld();
		this.addWorldTestEntities();
	}

	private registerWorld() {
		this.world = new World()
			.registerComponent(Position)
			.registerComponent(Velocity)
			.registerComponent(Emission)
			.registerSystem(MovableSystem)
			.registerSystem(EmissionSystem)
			.registerSystem(EmissionDetectorSystem, { getNet: () => this.net });

		let lastTime = performance.now() / 1000;
		this.worldTimer = setInterval(() => {
			let time = performance.now() / 1000;
			let delta = time - lastTime;
			lastTime = time;

			// Run all the systems
			this.world.execute(delta, time);
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
			});

		// parts of the ship
		this.world
			.createEntity()
			.addComponent(Position)
			.addComponent(EmissionDetector, {
				type: 'heat',
			});
	}

	public toJSON() {
		return {
			lights_on: this.lights_on,
			paused: this.paused,
			state: this.state,
			_ship: this.ship.toJSON(),
		};
	}
	public static fromJSON(obj): Game {
		let game = new this();

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
				this.setPlayerLights(value);
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
			case 'power2':
				if (value > 90) {
					this.setPlayerLights(false);
				}
				break;
		}
	}

	private setPlayerLights(value) {
		this.lights_on = value;
		this.net.broadcast({
			event: 'lights_on',
			value: this.lights_on,
		});
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

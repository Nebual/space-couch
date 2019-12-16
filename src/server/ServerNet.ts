import {
	server as WSServer,
	connection as WSConnection,
	request as WSRequest,
} from 'websocket';
import { Server as HttpServer } from 'http';
import { Game } from './Game';
import { throttle } from './commonUtil';

export interface NetPacket {
	event: string;
	id?: string | number;
	value: any;
}

export class Connection {
	private _connection: WSConnection;
	public role: Role;

	constructor(_connection: WSConnection) {
		this._connection = _connection;
	}

	public send(data: NetPacket) {
		this._connection.send(JSON.stringify(data));
	}
	public sendEvent(event: string, value: any) {
		this.send(<NetPacket>{ event: event, value: value });
	}

	public toString(): string {
		return `<Connection ${this.role} ${this._connection.remoteAddress}:${this._connection.socket.remotePort} ${this._connection.state}>`;
	}
}

export class ServerNet {
	private wsServer: WSServer;
	private connections: Connection[] = [];
	private game: Game;
	private throttles: {
		[key: string]: {
			timer?: NodeJS.Timeout;
			func?: () => void;
			nextTime: number;
		};
	} = {};

	constructor(game: Game, server: HttpServer) {
		this.setGame(game);
		this.wsServer = new WSServer({
			httpServer: server,
		});

		this.wsServer.on('request', (request: WSRequest) => {
			let rawConnection = request.accept(null as any, request.origin);
			let connection = new Connection(rawConnection);

			rawConnection.on('message', raw_message => {
				if (raw_message.type !== 'utf8') return;
				let msg = JSON.parse(raw_message.utf8Data || '');
				this.onMessage(connection, msg);
			});
			rawConnection.on('close', (code: number, desc: string) => {
				this.onClose(connection);
			});
		});
	}

	onMessage(connection: Connection, msg: NetPacket): void {
		console.log('Got a message!', msg);

		switch (msg.event) {
			case 'init':
				connection.role = 'list';
				this.connections.push(connection);
				return;
			case 'changeRole':
				connection.role = msg.value;
				break;
		}
		this.game.onMessage(connection, msg);
	}

	onClose(connection: Connection) {
		console.log(`WS Closed ${connection}`);
		const i = this.connections.indexOf(connection);
		if (i > -1) {
			this.connections.splice(i, 1);
		}
	}

	broadcast(
		data: NetPacket,
		role: Role | '' = '',
		exceptConnection?: Connection
	) {
		this.connections.forEach(function(connection) {
			if (role && connection.role != role) return;
			if (exceptConnection && exceptConnection === connection) return;
			connection.send(data);
		});
	}

	broadcastEvent(
		event: string,
		id: string,
		value: any,
		role: Role | '' = ''
	) {
		this.broadcast({ event: event, id: id, value: value }, role);
	}

	broadcastStateThrottled(
		id: string,
		value: any,
		role: Role,
		delay: number = 1000
	) {
		const packet = { event: 'state', id, value };
		throttle('state.' + id, () => this.broadcast(packet, role), delay);
	}

	setGame(game: Game) {
		this.game = game;
		game.net = this;
	}
}

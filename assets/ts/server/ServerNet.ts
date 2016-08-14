import {server as WSServer, connection as WSConnection, request as WSRequest, IMessage} from "websocket";
import {Server} from "http";
import {Game} from "./Game";
const WebSocketServer = require('websocket').server;

export interface NetPacket {
    event: string;
    id?: string|number;
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
        this.send(<NetPacket>{'event': event, 'value': value});
    }

    public toString(): string {
        return `<Connection ${this.role} ${this._connection.remoteAddress}:${this._connection.socket.remotePort} ${this._connection.state}>`;
    }
}

export class ServerNet {
    private wsServer: WSServer;
    private connections: Connection[] = [];
    private game: Game;

    constructor(game: Game, server: Server) {
        this.game = game;
        this.wsServer = new WebSocketServer({
            httpServer: server,
        });

        this.wsServer.on('request', (request: WSRequest) => {
            let rawConnection = request.accept(null, request.origin);
            let connection = new Connection(rawConnection);

            rawConnection.on('message', (raw_message) => {
                this.onMessage(connection, raw_message);
            });
            rawConnection.on('close', (code: number, desc: string) => {
                this.onClose(connection);
            });
        });
    }

    onMessage(connection: Connection, raw_message: IMessage) : void {
        if (raw_message.type !== 'utf8') return;
        var msg = JSON.parse(raw_message.utf8Data);
        console.log("Got a message!", msg);

        switch(msg.event) {
            case 'init':
                connection.role = msg.role;
                this.connections.push(connection);
                this.game.initConnection(connection);
                return;
            case 'state':
                console.log("They set " + msg.id + " to " + msg.value);
                this.game.setRoleState(connection.role, msg.id, msg.value);
                break;
        }
        this.game.onMessage(<NetPacket>msg);
    }

    onClose(connection: Connection) {
        console.log(`WS Closed ${connection}`);
        var i = this.connections.indexOf(connection);
        if(i > -1) {
            this.connections.splice(i, 1);
        }
    }

    broadcast(data: NetPacket, role: Role|'' ='') {
        this.connections.forEach(function(connection) {
            if(role && connection.role != role) return;
            connection.send(data);
        });
    }
    broadcastEvent(event: string, id: string, value, role: Role|''='') {
        this.broadcast({'event': event, 'id': id, 'value': value}, role);
    }
}

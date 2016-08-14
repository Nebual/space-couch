import {ServerNet, Connection, NetPacket} from "./ServerNet";
import {ShipNodes, RoomType} from "./ship";

export class Game {
    public lights_on;
    public paused;
    private state;
    public ship: ShipNodes;
    public net: ServerNet;

    constructor() {
        this.lights_on = true;
        this.paused = false;
        this.state = {
            'captain': {},
            'engineer': {},
            'navigator': {},
            'robotics': {},
            'weapons': {},
        };
    }

    public initConnection(connection:Connection) {
        this.ship.initConnection(connection);
        connection.sendEvent('lights_on', this.lights_on);
        connection.sendEvent('pause', this.paused);

        var role_state = this.getRoleStates(connection.role);
        for(let index of Object.keys(role_state)) {
            connection.send({'event': 'state', 'id': index, 'value': role_state[index]});
        }
    }

    public setRoleState(role: Role, id: string, value) {
        this.state[role][id] = value;
        this.net.broadcast({'event': 'state', 'id': id, 'value': value}, role);

        switch(id) {
            case 'main_power_system':
                this.lights_on = value;
                this.net.broadcast({'event': 'lights_on', 'value': this.lights_on});
                break;
            case 'flush_gravity':
                this.net.broadcast({'event': 'vibrate', 'value': 300});
                break;
            case 'pause':
                this.paused = value;
                this.net.broadcast({'event': 'pause', 'value': this.paused});
                break;
            case 'start_generator_fire':
                this.ship.startFire(RoomType.Generator);
                break;
        }
    }
    public getRoleState(role, id) {
        return this.state[role][id];
    }
    private getRoleStates(role) {
        return this.state[role] || {};
    }

    public initShip(shipName: string) {
        this.ship = new ShipNodes(this, shipName);
        this.ship.createRobots(3);
    }

    public onMessage(msg: NetPacket) {
        this.ship.onMessage(msg);
    }
}

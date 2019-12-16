import { useEffect, useState, useContext, createContext } from 'react';
import uniqueSlug from 'unique-slug';

export class ClientNet {
	private sock;
	private messageListeners: { [hookId: string]: (msg) => void } = {};

	constructor() {
		this.startWebSocket();
		setInterval(() => {
			this.checkWebSocket();
		}, 5000);
	}
	public sendRaw(obj): void {
		this.sock.send(JSON.stringify(obj));
	}
	public send(obj: object): void {
		if (this.sock.readyState === 1) {
			this.sendRaw(obj);
		} else {
			// queue until connected
			const intervalId = setInterval(() => {
				if (this.sock.readyState === 1) {
					this.sendRaw(obj);
					clearInterval(intervalId);
				}
			}, 100);
		}
	}
	public sendState(id: string, value: any): void {
		this.send({ event: 'state', id: id, value: value });
	}
	public updateRole(): void {
		let packet = { event: 'changeRole', value: ClientNet.getRole() };
		this.send(packet);
		this.callListeners(packet);
	}

	private static getRole(): string {
		if (window.location.host === '') {
			// electron
			return 'overview';
		} else {
			let match = window.location.pathname.match(/([A-Za-z]+)/);
			return match ? match[1] : 'list';
		}
	}

	private startWebSocket() {
		const wsHost =
			window.location.port === '3000'
				? `${window.location.hostname}:8000`
				: window.location.host;
		const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		this.sock = new WebSocket(`${wsProtocol}://${wsHost}/ws/`);
		this.sock.onopen = e => {
			console.log('WS: opened!');
			this.sendRaw({ event: 'init' });
			this.updateRole();
		};
		this.sock.onmessage = e => {
			let data = JSON.parse(e.data);
			console.debug('WS: received', data);
			this.callListeners(data);
		};
		this.sock.onclose = e => {
			console.log('WS: closed!');
			this.checkWebSocket();
		};
	}

	private callListeners(packet) {
		Object.values(this.messageListeners).map(callback => callback(packet));
	}

	public subscribeListener(hookId, callback) {
		this.messageListeners[hookId] = callback;
	}

	public unsubscribeListener(hookId) {
		delete this.messageListeners[hookId];
	}

	private checkWebSocket() {
		if (!this.sock || this.sock.readyState === WebSocket.CLOSED)
			this.startWebSocket();
	}
}

export const ClientNetContext = createContext(new ClientNet());
export const useClientNet: () => ClientNet = () =>
	useContext(ClientNetContext as any);

export const useWebsocketMessage = callback => {
	const clientNet = useClientNet();
	const [hookId] = useState(() => uniqueSlug());

	useEffect(() => {
		clientNet.subscribeListener(hookId, callback);
		return () => {
			clientNet.unsubscribeListener(hookId);
		};
	}, [clientNet, callback, hookId]);
};

export const useWebsocketStateChange = (callback, id) => {
	const clientNet = useClientNet();
	const [hookId] = useState(() => uniqueSlug());

	useEffect(() => {
		if (!id) {
			return;
		}
		clientNet.subscribeListener(hookId, payload => {
			if (payload.event === 'state' && payload.id === id) {
				callback(payload.value);
			}
		});
		return () => {
			clientNet.unsubscribeListener(hookId);
		};
	}, [clientNet, id, hookId, callback]);
};

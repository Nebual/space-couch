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
		this.send({ event: 'changeRole', value: ClientNet.getRole() });
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
				? '127.0.0.1:8000'
				: window.location.host;
		this.sock = new WebSocket(`ws://${wsHost}/ws`);
		this.sock.onopen = e => {
			console.log('we opened a WS!');
			this.sendRaw({ event: 'init' });
		};
		this.sock.onmessage = e => {
			let data = JSON.parse(e.data);
			console.log('WS: received', data);
			Object.values(this.messageListeners).map(callback =>
				callback(data)
			);
		};
		this.sock.onclose = e => {
			console.log('WS closed!');
			this.checkWebSocket();
		};
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

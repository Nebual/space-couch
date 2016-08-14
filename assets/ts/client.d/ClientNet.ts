class ClientNet {
	private sock;

	constructor() {
		this.startWebSocket();
		setInterval(() => {
			this.checkWebSocket()
		}, 5000);
	}
	public sendRaw(obj) : void {
		this.sock.send(JSON.stringify(obj));
	}
	public send(event: string, id: string, value: any) : void {
		this.sendRaw({'event': event, 'id': id, 'value': value});
	}
	public sendState(id: string, value: any) : void {
		this.send('state', id, value);
	}

	private getRole() : string {
		if(window.location.host == '') {  // electron
			return 'overview';
		} else {
			let match = window.location.pathname.match(/([A-Za-z]+)/);
			return match ? match[1] : 'list';
		}
	}

	private startWebSocket() {
		let self = this;
		this.sock = new WebSocket("ws://" + (window.location.host ? window.location.host : '127.0.0.1:8000') + "/ws");
		this.sock.onopen = function (e) {
			console.log("we opened a WS!");
			self.sendRaw({'event': 'init', 'role': self.getRole()});
		};
		this.sock.onmessage = function (e) {
			var data = JSON.parse(e.data);
			console.log("Got", data);
			$(document).trigger('sock-message', [data]);
			switch (data.event) {
				case 'lights_on':
					if (data.value) {
						$('body').css({'background-color': 'white'});
					} else {
						$('body').css({'background-color': 'black'});
					}
					break;
				case 'state':
					var $elem = $('[data-sync="' + data.id + '"]');

					if($elem.data('toggle') == 'button') {
						$elem.toggleClass('active', data.value);
					} else if($elem.data('rangeSlider')) {
						$elem.data('rangeSlider').setValue(data.value);
					}
					break;
				case 'pause':
					$('#pause-dialog').toggle(data.value);
					break;
			}
		};
		this.sock.onclose = function (e) {
			console.log('WS closed!');
			self.checkWebSocket();
		};
	}
	private checkWebSocket() {
		if(!this.sock || this.sock.readyState === WebSocket.CLOSED) this.startWebSocket();
	}
}

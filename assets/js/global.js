$(function() {
	'use strict';

	navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;// || function() {};
	function vibrate(ms) {
		if (!navigator.vibrate) return; // unsupported
		if (ms === undefined || ms === true || ms === false) ms = 200;
		navigator.vibrate(ms);
	}

	var sock = null;
	function startWebSocket() {
		sock = new WebSocket("ws://" + window.location.host + "/ws");
		sock.onopen = function (e) {
			console.log("we opened a WS!");
			sock.send('{"event": "init"}');
		};
		sock.onmessage = function (e) {
			var data = JSON.parse(e.data);
			console.log("Got", data);
			switch (data.event) {
				case 'main_power_system':
					if (data.value) {
						$('body').css({'background-color': 'white'});
					} else {
						$('body').css({'background-color': 'black'});
					}
					break;
				case 'state':
					var $button = $('[data-sync="' + data.id + '"]');
					$button.toggleClass('active', data.value);
					break;
				case 'vibrate':
					vibrate(data.value);
					break;
			}
		};
		sock.onclose = function (e) {
			console.log('closed!');
			checkWebSocket();
		};
	}
	function checkWebSocket() {
		if(!sock || sock.readyState === WebSocket.CLOSED) startWebSocket();
	}
	startWebSocket();
	setInterval(checkWebSocket, 5000);

	$('[data-sync]').click(function() {
		console.log($(this).data('sync'), !$(this).hasClass('active'), 'was clicked');
		sock.send(JSON.stringify({'event': 'state', 'id': $(this).data('sync'), 'value': !$(this).hasClass('active')}));
	});
});

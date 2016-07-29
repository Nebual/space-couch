$(function() {
	'use strict';

	var role;
	if(window.location.host == '') {  // electron
		role = 'captain';
	} else {
		role = window.location.pathname.match(/([A-Za-z]+)/)[1];
	}

	navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;// || function() {};
	function vibrate(ms) {
		if (!navigator.vibrate) return; // unsupported
		if (ms === undefined || ms === true || ms === false) ms = 200;
		navigator.vibrate(ms);
	}

	var sock = null;
	function startWebSocket() {
		sock = new WebSocket("ws://" + (window.location.host ? window.location.host : '127.0.0.1:8000') + "/ws");
		sock.onopen = function (e) {
			console.log("we opened a WS!");
			sock.send(JSON.stringify({'event': 'init', 'role': role}));
		};
		sock.onmessage = function (e) {
			var data = JSON.parse(e.data);
			console.log("Got", data);
			switch (data.event) {
				case 'lights_on':
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
				case 'pause':
					$('#pause-dialog').toggle(data.value);
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

	$('.range-slider').each(function(i) {
		rangeSlider(this, {
			vertical: $(this).data('vertical') ? true : false,
			drag: function(v) {
				console.log("Power", v);
			}
		});
	})
});

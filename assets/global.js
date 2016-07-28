$(function() {
	'use strict';

	var sock = new WebSocket("ws://"+window.location.host+"/ws");
	sock.onopen = function(e) {
		console.log("we opened a WS!");
		sock.send('{"event": "init"}');
	};
	sock.onmessage = function (e) {
		var data = JSON.parse(e.data);
		console.log("Got", data);
		switch(data.event) {
			case 'main_power_system':
				if(data.value) {
					$('body').css({'background-color': 'white'});
				} else {
					$('body').css({'background-color': 'black'});
				}
				break;
			case 'state':
				var $button = $('[data-sync="'+data.id+'"]');
				$button.toggleClass('active', data.value);
		}
	};

	$('[data-sync]').click(function() {
		console.log($(this).data('sync'), !$(this).hasClass('active'), 'was clicked');
		sock.send(JSON.stringify({'event': 'state', 'id': $(this).data('sync'), 'value': !$(this).hasClass('active')}));
	});
});

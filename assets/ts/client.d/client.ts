'use strict';
var clientNet = new ClientNet();
$(function() {

	$(document).on('sock-message', function(e, data) {
		switch (data.event) {
			case 'vibrate':
				vibrate(data.value);
				break;
		}
	});

	$('button[data-sync]').click(function() {
		console.log($(this).data('sync'), !$(this).hasClass('active'), 'was clicked');
		clientNet.sendState($(this).data('sync'), !$(this).hasClass('active'));
	});

	var lobby_hold_timer;
	$('.lobby-button').on('mousedown touchstart', function() {
		lobby_hold_timer = setTimeout(function () {
			window.location.assign('/');
		}, 1000);
	}).on('mouseup mouseleave touchend', function() {
		clearTimeout(lobby_hold_timer);
	});
});
window.addEventListener('load', function(e) {
	// Vague attempts to hide the address bar... doesn't work in most browsers anymore
	window.scrollTo(0, 1);
	setTimeout(function() { window.scrollTo(0, 1); }, 1);
}, false);

var throttleTimers = {};
function throttle(id: string, func: {(): void;}, delay_ms: number): void {
	var now = (new Date()).getTime();
	if(now > (throttleTimers[id] || 0))  {
		throttleTimers[id] = now + delay_ms;
		setTimeout(func, delay_ms)
	}
}

navigator.vibrate = navigator.vibrate || (navigator as any).webkitVibrate || (navigator as any).mozVibrate || (navigator as any).msVibrate;
function vibrate(ms) {
	if (!navigator.vibrate) return; // unsupported
	if (ms === undefined || ms === true || ms === false) ms = 200;
	navigator.vibrate(ms);
}

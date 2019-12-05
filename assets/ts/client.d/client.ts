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
});
window.addEventListener('load', function(e) {
	// Vague attempts to hide the address bar... doesn't work in most browsers anymore
	window.scrollTo(0, 1);
	setTimeout(function() { window.scrollTo(0, 1); }, 1);
}, false);

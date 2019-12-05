import React from 'react';

import './Console.scss';

export default function Console() {
	/*$(document).on('sock-message', function(e, data) {
		$console.text($console.text() + (new Date()).toLocaleTimeString() + ': ' + JSON.stringify(data) + "\n");
		$console.scrollTop($console.prop("scrollHeight"));
	});*/

	return (
		<div className="console">&gt; tail -f /var/log/ship/network.log</div>
	);
}

import React, { useEffect, useRef, useState } from 'react';

import './Console.scss';
import { useWebsocketMessage } from '../../client/ClientNet';

export default function Console() {
	const [messages, setMessages] = useState(
		'> tail -f /var/log/ship/network.log\n'
	);
	useWebsocketMessage(packet => {
		const packetStr = JSON.stringify(packet);
		const dateStr = new Date().toLocaleTimeString();
		setMessages(messages + `${dateStr}: ${packetStr}\n`);
	});
	const endOfConsoleRef = useRef(null);

	useEffect(() => {
		endOfConsoleRef.current.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);
	// todo: trigger ^ when card is swiped into

	return (
		<div className="console">
			{messages}
			<div ref={endOfConsoleRef} />
		</div>
	);
}

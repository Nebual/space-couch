import React, { useState } from 'react';

import './DebugRole.scss';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { useClientNet, useWebsocketMessage } from '../../client/ClientNet';

export default function DebugRole() {
	const clientNet = useClientNet();
	const [debugText, setDebugText] = useState('');
	useWebsocketMessage(packet => {
		if (packet.event === 'debugPositions') {
			console.log(packet.value);
			setDebugText(JSON.stringify(packet.value, null, '  '));
		}
	});
	return (
		<div className="container-debug">
			<Typography variant="h3" className="text-center">
				Secret Debug View
			</Typography>

			<Button
				onClick={() => {
					clientNet.send({ event: 'debugPositions' });
				}}
				className="btn btn-warning"
				style={{ marginLeft: '3em' }}
			>
				<i className="fa fa-2x fa-battery-empty" />
			</Button>
			<div style={{ whiteSpace: 'pre' }}>{debugText}</div>
		</div>
	);
}

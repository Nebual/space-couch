import React, { useState } from 'react';
import './RoleList.scss';
import InputLabel from '@material-ui/core/InputLabel';
import NativeSelect from '@material-ui/core/NativeSelect';
import { useClientNet, useWebsocketMessage } from '../../client/ClientNet';

export default function ShipSelector() {
	const [shipType, setShipType] = useState('ship1');
	const clientNet = useClientNet();

	useWebsocketMessage(packet => {
		switch (packet.event) {
			case 'shipId':
				setShipType(packet.value);
				break;
			default:
		}
	});
	return (
		<div className="selector-container">
			<InputLabel id="ship-select-label">Select Ship</InputLabel>
			<NativeSelect
				labelId="ship-select-label"
				onChange={event => {
					setShipType(event.target.value);
					clientNet.send({
						event: 'changeShip',
						value: event.target.value,
					});
				}}
				value={shipType}
			>
				<option value="ship1">Ship 1</option>
				<option value="ship2">Ship 2</option>
				<option value="ship3" disabled={true}>
					Ship 3
				</option>
			</NativeSelect>
		</div>
	);
}

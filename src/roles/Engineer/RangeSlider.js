import React, { useState } from 'react';

import Slider from '@material-ui/core/Slider';
import { throttle } from '../../Util';

import './RangeSlider.scss';
import { useClientNet, useWebsocketStateChange } from '../../client/ClientNet';

const marks = [
	{
		value: 20,
	},
	{
		value: 40,
	},
	{
		value: 60,
	},
	{
		value: 80,
	},
];

export default function RangeSlider({
	vertical = true,
	syncId,
	syncDelay = 333,
	initialValue = 0,
	onChange,
}) {
	const clientNet = useClientNet();
	const [displayValue, setDisplayValue] = useState(initialValue);
	useWebsocketStateChange(newValue => {
		setDisplayValue(newValue);
		onChange && onChange(newValue);
	}, syncId);

	return (
		<div className="range-slider-container">
			<Slider
				orientation={vertical ? 'vertical' : 'horizontal'}
				marks={marks}
				value={displayValue}
				onChange={(e, newValue) => {
					setDisplayValue(newValue);
					onChange && onChange(newValue);
					syncId &&
						throttle(
							syncId,
							() => {
								clientNet.sendState(syncId, newValue);
							},
							syncDelay
						);
				}}
			/>
		</div>
	);
}

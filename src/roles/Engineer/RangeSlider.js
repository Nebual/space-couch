import React, { useState } from 'react';

import Slider from '@material-ui/core/Slider';
import { throttle } from '../../Util';

import './RangeSlider.scss';

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

RangeSlider.defaultProps = {
	vertical: true,
	initialValue: 0,
	syncDelay: 250,
};

export default function RangeSlider({
	vertical,
	syncId,
	syncDelay,
	initialValue,
	onChange,
}) {
	const [displayValue, setDisplayValue] = useState(initialValue);

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
								//clientNet.sendState(syncId, newValue)
							},
							syncDelay
						);
				}}
			/>
		</div>
	);
}

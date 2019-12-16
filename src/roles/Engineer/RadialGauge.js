import React, { useEffect, useState } from 'react';

import './RadialGauge.scss';
import { useWebsocketStateChange } from '../../client/ClientNet';

export default function RadialGauge({
	style,
	value: valueOverride, // 0-100
	syncId,
	suffix = '%',
	inverted = false,
	small = false,
}) {
	const [value, setValue] = useState(valueOverride || 0);
	useEffect(() => setValue(valueOverride || 0), [valueOverride]);
	useWebsocketStateChange(newValue => setValue(newValue * 100), syncId);

	return (
		<div
			className={!small ? 'gauge-container' : 'gauge-container--sm'}
			style={style}
		>
			<div className={`gauge ${inverted && 'inverted'}`}>
				<div className="dial">
					<div
						className="indicator"
						style={{
							transform: `rotate(${value * 2.4 - 120}deg)`,
						}}
					/>
					<div className="dialbase">
						<output>{Math.round(value) + suffix}</output>
					</div>
				</div>
			</div>
		</div>
	);
}

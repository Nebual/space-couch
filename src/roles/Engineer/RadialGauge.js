import React from 'react';

import './RadialGauge.scss';

export default function RadialGauge({ style, value }) {
	return (
		<div className="gauge-container" style={style}>
			<div className="gauge">
				<div className="dial">
					<div
						className="indicator"
						style={{
							transform: `rotate(${value * 2.4 - 120}deg)`,
						}}
					/>
					<div className="dialbase">
						<output>{Math.round(value) + '°C'}</output>
					</div>
				</div>
			</div>
		</div>
	);
}

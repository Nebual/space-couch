import React, { useState } from 'react';
import Typography from '@material-ui/core/Typography';

import './Helm.scss';
import SpinningWheel from './SpinningWheel';
import Chadwell from './Chadwell';

export default function Helm() {
	const [angle, setAngle] = useState(0);
	const [throttle, setThrottle] = useState('stop');
	const shipTurnMultiplier = 1 / 8;
	return (
		<div className="container-helm">
			<Typography variant="h3" className="text-center">
				Helm
			</Typography>
			<Typography variant="body2" className="text-center">
				{angle.toFixed(0)}
			</Typography>
			<Typography variant="body2" className="text-center">
				{throttle}
			</Typography>
			<SpinningWheel
				incrementAngle={delta => {
					setAngle((angle + delta * shipTurnMultiplier) % 360);
				}}
			/>
			<Chadwell setThrottle={setThrottle} />
		</div>
	);
}

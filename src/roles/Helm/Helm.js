import React, { useRef, useState } from 'react';
import { Stage, Sprite, useTick } from '@inlet/react-pixi';
import Typography from '@material-ui/core/Typography';

import './Helm.scss';
import SpinningWheel from './SpinningWheel';
import Chadwell from './Chadwell';
import StarCanvas from '../Robotics/StarCanvas';
import { useViewSize } from '../../App';
import Button from '@material-ui/core/Button';
import classNames from 'classnames';

const THROTTLE_MULTIPLIERS = {
	stop: 0,
	standby: 0,
	deadslow: 0.1,
	slow: 0.25,
	half: 0.5,
	full: 1,
	revfull: -1,
	revhalf: -0.5,
	revslow: -0.25,
	revdeadslow: -0.1,
	off: 0,
};

export default function Helm() {
	const [angle, setAngle] = useState(90);
	const [throttle, setThrottle] = useState('slow');
	const [thrust, setThrust] = useState(false);
	const viewSize = useViewSize();
	const shipTurnMultiplier = 1 / 6;

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
			<StarCanvas panSpeed={0.075 + THROTTLE_MULTIPLIERS[throttle]} />
			<Stage
				className="helm-canvas"
				options={{ transparent: true }}
				{...viewSize}
			>
				<ShipSprite
					angle={angle}
					speed={thrust * 60}
					bounds={viewSize}
				/>
			</Stage>
			<Button
				onMouseDown={() => {
					setThrust(true);
				}}
				onMouseUp={() => {
					setThrust(false);
				}}
				onTouchStart={() => {
					setThrust(true);
				}}
				onTouchEnd={() => {
					setThrust(false);
				}}
				variant="contained"
				className={classNames(thrust && 'active', 'button--thrust')}
			>
				Thrust
			</Button>
			<SpinningWheel
				incrementAngle={delta => {
					setAngle((angle + delta * shipTurnMultiplier) % 360);
				}}
			/>
			<Chadwell setThrottle={setThrottle} />
		</div>
	);
}

function ShipSprite({ angle, speed, bounds }) {
	const _position = useRef({ x: 200, y: 200 });
	const [position, setPosition] = useState(_position.current);

	useTick(delta => {
		_position.current = {
			x:
				_position.current.x +
				(speed * Math.sin((angle / 180) * Math.PI) * delta) / 60,
			y:
				_position.current.y +
				(speed * -Math.cos((angle / 180) * Math.PI) * delta) / 60,
		};
		// collisions
		if (_position.current.x < 0) {
			_position.current.x = 0;
		}
		if (_position.current.y < 0) {
			_position.current.y = 0;
		}
		if (_position.current.x > bounds.x) {
			_position.current.x = bounds.x;
		}
		if (_position.current.y > bounds.y) {
			_position.current.y = bounds.y;
		}
		setPosition(_position.current);
	});

	return (
		<Sprite
			image="/images/ships/ship2.xs.png"
			{...position}
			angle={angle - 90}
			pivot={{ x: 19 * 2, y: 14 * 2 }}
		/>
	);
}

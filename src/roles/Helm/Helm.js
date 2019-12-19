import React, { useEffect, useRef, useState } from 'react';
import TouchHandler from 'react-touch/lib/TouchHandler';
import Typography from '@material-ui/core/Typography';

import './Helm.scss';
import useAnimationFrame from '../Weapons/useAnimationFrame';

export default function Helm() {
	const [angle, setAngle] = useState(0);
	const shipTurnMultiplier = 1 / 8;
	return (
		<div className="container-helm">
			<Typography variant="h3" className="text-center">
				Helm
			</Typography>
			<Typography variant="body2" className="text-center">
				{angle.toFixed(0)}
			</Typography>
			<SpinningWheel
				incrementAngle={delta => {
					setAngle((angle + delta * shipTurnMultiplier) % 360);
				}}
			/>
		</div>
	);
}

const wheelSpeedMultiplier = 1 / 90;
const maxTurnSpeed = 1500;
const wheelFriction = 50;
function SpinningWheel({ incrementAngle }) {
	const touchHandlerRef = useRef(null);
	const lastTouchX = useRef(null);
	const [wheelRotation, setWheelRotation] = useState(0);
	const [accel, setAccel] = useState(0);

	const touchStartHandler = useRef(() => {});
	touchStartHandler.current = ({ x, y }) => {
		lastTouchX.current = x - accel;
	};
	const touchMoveHandler = useRef(() => {});
	touchMoveHandler.current = ({ x, y }) => {
		let delta = x - lastTouchX.current;
		if (Math.sign(delta) !== Math.sign(accel)) {
			delta *= 5; // let pilot reverse rotation quickly ("stop the wheel")
		}
		const newAccel = accel + delta;
		setAccel(Math.max(-maxTurnSpeed, Math.min(maxTurnSpeed, newAccel)));
		lastTouchX.current = x;
	};

	useEffect(() => {
		touchHandlerRef.current = new TouchHandler(
			(...props) => touchStartHandler.current(...props),
			(...props) => touchMoveHandler.current(...props),
			function touchEnd() {
				lastTouchX.current = null;
			}
		);
		setAccel(0.1); // trigger a rerender so event listeners get bound
		return () => touchHandlerRef.current.removeListeners();
	}, []);
	const touchHandlers =
		touchHandlerRef.current &&
		touchHandlerRef.current.listeners({ props: {} });

	useAnimationFrame(() => {
		if (Math.abs(accel) < 5) {
			return;
		}
		setWheelRotation(wheelRotation + accel * wheelSpeedMultiplier);
		incrementAngle(accel * wheelSpeedMultiplier);

		if (lastTouchX.current === null) {
			const friction = Math.max(3, Math.abs(accel / wheelFriction));
			setAccel(accel - Math.sign(accel) * friction);
		}
	}, [accel, wheelRotation]);
	return (
		<div className="helm-wheel-container">
			<img
				alt="Steering Wheel"
				className="helm-wheel"
				src="/images/wooden_wheel.webp"
				style={{
					transform: `rotateZ(${wheelRotation}deg)`,
				}}
				{...touchHandlers}
				onContextMenu={e => {
					e.preventDefault();
				}}
			/>
		</div>
	);
}

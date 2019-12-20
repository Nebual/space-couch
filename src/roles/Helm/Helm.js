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
			<Chadwell />
		</div>
	);
}

function useTouchHandler(startHandler, moveHandler, stopHandler) {
	const [touchHandler, setTouchHandler] = useState(null);
	const startRef = useRef(startHandler);
	const moveRef = useRef(moveHandler);
	const stopRef = useRef(stopHandler);

	startRef.current = startHandler;
	moveRef.current = moveHandler;
	stopRef.current = stopHandler;

	useEffect(() => {
		const newTouchHandler = new TouchHandler(
			(...args) => startRef.current(...args),
			(...args) => moveRef.current(...args),
			(...args) => stopRef.current(...args)
		);
		setTouchHandler(newTouchHandler);
		return () => newTouchHandler.removeListeners();
	}, []);

	return touchHandler && touchHandler.listeners({ props: {} });
}

const wheelSpeedMultiplier = 1 / 90;
const maxTurnSpeed = 1500;
const wheelFriction = 50;
function SpinningWheel({ incrementAngle }) {
	const lastTouchX = useRef(null);
	const [wheelRotation, setWheelRotation] = useState(0);
	const [accel, setAccel] = useState(0);

	const touchHandlers = useTouchHandler(
		function start({ x, y }) {
			lastTouchX.current = x - accel;
		},
		function move({ x, y }) {
			let delta = x - lastTouchX.current;
			if (Math.sign(delta) !== Math.sign(accel)) {
				delta *= 5; // let pilot reverse rotation quickly ("stop the wheel")
			}
			const newAccel = accel + delta;
			setAccel(Math.max(-maxTurnSpeed, Math.min(maxTurnSpeed, newAccel)));
			lastTouchX.current = x;
		},
		function end() {
			lastTouchX.current = null;
		}
	);

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
					willChange: Math.abs(accel) > 5 && 'transform',
				}}
				{...touchHandlers}
				onContextMenu={e => {
					e.preventDefault();
				}}
			/>
		</div>
	);
}

function Chadwell() {
	const [rotation, setRotation] = useState(0);
	const baseRef = useRef(null);

	const touchHandlers = useTouchHandler(
		function start({ x, y }) {},
		function move({ x, y }) {
			const rect = baseRef.current.getBoundingClientRect();
			const dx = rect.x + rect.width / 2 - x;
			const dy = rect.y + rect.height / 2 - y;

			setRotation((Math.atan2(dy, dx) * 180) / Math.PI + 270);
		},
		function end() {
			// todo: snap to closest interval (with transition smoothing)
		}
	);

	return (
		<div className="helm-chadwell-container">
			<img
				ref={baseRef}
				alt="Engine Order Telegraph"
				className="helm-chadwell-base"
				src="/images/engine-order-telegraph-base.svg"
			/>
			<img
				{...touchHandlers}
				alt="Handle"
				className="helm-chadwell-handle"
				src="/images/engine-order-telegraph-handle.svg"
				style={{
					transform: `rotateZ(${rotation}deg)`,
				}}
			/>
		</div>
	);
}

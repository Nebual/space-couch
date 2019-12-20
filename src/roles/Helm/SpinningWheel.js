import React, { useRef, useState } from 'react';

import useAnimationFrame from '../../components/useAnimationFrame';
import useTouchHandler from '../../components/useTouchHandler';

const wheelSpeedMultiplier = 1 / 90;
const maxTurnSpeed = 1500;
const wheelFriction = 50;

export default function SpinningWheel({ incrementAngle }) {
	const lastTouchX = useRef(null);
	const [wheelRotation, setWheelRotation] = useState(0);
	const [accel, setAccel] = useState(0);

	const touchHandlers = useTouchHandler(
		function start({ x, y }) {
			lastTouchX.current = x - accel;
		},
		function move(movement) {
			if (!movement) return;
			const { x } = movement;
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

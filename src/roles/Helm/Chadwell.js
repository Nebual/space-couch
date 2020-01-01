import React, { useRef, useState } from 'react';
import useTouchHandler from '../../components/useTouchHandler';

export default function Chadwell({ setThrottle }) {
	const [rotation, setRotation] = useState(278);
	const [smooth, setSmooth] = useState(false);
	const baseRef = useRef(null);

	const touchHandlers = useTouchHandler(
		function start({ x, y }) {
			setSmooth(false);
		},
		function move({ x, y }) {
			const rect = baseRef.current.getBoundingClientRect();
			const dx = rect.x + rect.width / 2 - x;
			const dy = rect.y + rect.height / 2 - y;

			setRotation((Math.atan2(dy, dx) * 180) / Math.PI + 270);
		},
		function end() {
			setSmooth(true);
			const snapPoints = [
				['stop', 360],
				['standby', 332.75],
				['deadslow', 305.5714284],
				['slow', 278.8571427],
				['half', 252.142857],
				['full', 226.45],
				['revfull', 133.3],
				['revhalf', 107.45],
				['revslow', 439.4],
				['revdeadslow', 412.4285712],
				['off', 385.7142855],
			];

			const [closestId, closest] = snapPoints.reduce(
				function(prev, curr) {
					return Math.abs(curr[1] - rotation) <
						Math.abs(prev[1] - rotation)
						? curr
						: prev;
				},
				['', 0]
			);
			setThrottle(closestId);
			setRotation(closest);
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
					transition: smooth && 'transform 0.4s',
				}}
			/>
		</div>
	);
}

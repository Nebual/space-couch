import React, { useEffect, useRef } from 'react';

import './ButtonPush.scss';

export default function ButtonPush({ onLongPress, delay = 250 }) {
	const lobbyHoldTimer = useRef(0);

	const startTouch = () => {
		lobbyHoldTimer.current = setTimeout(onLongPress, delay);
	};
	const endTouch = () => {
		lobbyHoldTimer.current && clearTimeout(lobbyHoldTimer.current);
	};
	useEffect(() => {
		return () => {
			lobbyHoldTimer.current && clearTimeout(lobbyHoldTimer.current);
		};
	}, []);
	return (
		<div
			className="ButtonPush"
			onMouseDown={startTouch}
			onMouseUp={endTouch}
			onTouchStart={startTouch}
			onTouchEnd={endTouch}
		/>
	);
}

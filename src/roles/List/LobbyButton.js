import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';

let lobby_hold_timer;
export default function LobbyButton() {
	const [isRedirecting, setIsRedirecting] = useState(false);
	const lobbyButtonStartTouch = () => {
		lobby_hold_timer = setTimeout(function() {
			setIsRedirecting(true);
			setIsRedirecting(false);
		}, 1000);
	};
	const lobbyButtonEndTouch = () => {
		clearTimeout(lobby_hold_timer);
	};
	return (
		<>
			{isRedirecting && <Redirect to="/" />}
			<button
				type="button"
				className="btn btn-link lobby-button"
				onMouseDown={lobbyButtonStartTouch}
				onMouseUp={lobbyButtonEndTouch}
				onTouchStart={lobbyButtonStartTouch}
				onTouchEnd={lobbyButtonEndTouch}
			>
				<i className="fa fa-hand-o-left" />
			</button>
		</>
	);
}

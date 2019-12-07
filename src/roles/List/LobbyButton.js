import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { Redirect, useHistory } from 'react-router-dom';
import { useClientNet } from '../../client/ClientNet';

let lobby_hold_timer;
export default function LobbyButton() {
	const clientNet = useClientNet();
	const history = useHistory();
	useEffect(() => {
		clientNet.updateRole();
	}, [history.location.pathname, clientNet]);
	const hide =
		history.location.pathname === '/overview' ||
		history.location.pathname === '/list';

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
				className={classNames(
					'btn btn-link lobby-button',
					hide && 'hidden'
				)}
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

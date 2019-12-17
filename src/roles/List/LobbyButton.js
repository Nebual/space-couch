import React, { useEffect, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import { useClientNet } from '../../client/ClientNet';
import ConfirmButton from '../../components/ConfirmButton';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

let lobby_hold_timer;
export default function LobbyButton() {
	const clientNet = useClientNet();
	const history = useHistory();

	useEffect(() => {
		clientNet.updateRole();
	}, [history.location.pathname, clientNet]);
	const hide =
		history.location.pathname === '/overview' ||
		history.location.pathname === '/';

	const [isRedirecting, setIsRedirecting] = useState(false);

	useEffect(() => {
		if (isRedirecting) {
			setIsRedirecting(false);
		}
	}, [isRedirecting]);

	return (
		<>
			{isRedirecting && <Redirect to="/" />}
			{!hide ? (
				<ConfirmButton
					className="lobby-button"
					callBack={() => setIsRedirecting(true)}
				>
					<ArrowBackIcon />
				</ConfirmButton>
			) : null}
		</>
	);
}

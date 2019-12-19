import React, { useState } from 'react';
import classNames from 'classnames';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import StylesProvider from '@material-ui/styles/StylesProvider';

import { useWebsocketMessage } from './client/ClientNet';
import { vibrate } from './Util';
import Overview from './roles/Overview/Overview';
import RoleList from './roles/List/RoleList';
import LobbyButton from './roles/List/LobbyButton';
import Captain from './roles/Captain/Captain';
import Engineer from './roles/Engineer/Engineer';
import Robotics from './roles/Robotics/Robotics';
import Weapons from './roles/Weapons/Weapons';
import Radar from './roles/Radar/Radar';
import Helm from './roles/Helm/Helm';
import DebugRole from './roles/DebugRole/DebugRole';

import './global.scss';

function App() {
	const [isPaused, setIsPaused] = useState(false);
	useWebsocketMessage(packet => {
		if (packet.event === 'lights_on') {
			document.body.classList.toggle('lights-off', !packet.value);
		}
		if (packet.event === 'vibrate') {
			vibrate(packet.value);
		}
		if (packet.event === 'pause') {
			setIsPaused(packet.value);
		}
	});
	return (
		<div className="main-container">
			<div
				id="pause-dialog"
				className={classNames('dropshadow', !isPaused && 'hidden')}
			>
				<div className="dropshadow-background" />
				<i className="fa fa-pause-circle" />
			</div>
			<Router>
				<LobbyButton />
				<Switch>
					<Route path="/overview">
						<Overview />
					</Route>
					<Route exact path="/">
						<RoleList />
					</Route>
					<Route path="/captain">
						<Captain />
					</Route>
					<Route path="/engineer">
						<Engineer />
					</Route>
					<Route path="/robotics">
						<Robotics />
					</Route>
					<Route path="/radar">
						<Radar />
					</Route>
					<Route path="/weapons">
						<Weapons />
					</Route>
					<Route path="/helm">
						<Helm />
					</Route>
					<Route path="/debug">
						<DebugRole />
					</Route>
				</Switch>
			</Router>
		</div>
	);
}

export default function() {
	return (
		<StylesProvider injectFirst>
			<App />
		</StylesProvider>
	);
}

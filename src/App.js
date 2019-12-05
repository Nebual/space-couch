import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import StylesProvider from '@material-ui/styles/StylesProvider';

import RoleList from './roles/List/RoleList';
import LobbyButton from './roles/List/LobbyButton';
import Captain from './roles/Captain/Captain';
import Engineer from './roles/Engineer/Engineer';
import Robotics from './roles/Robotics/Robotics';
import Weapons from './roles/Weapons/Weapons';

import './global.scss';

function App() {
	return (
		<div className="main-container">
			<div
				id="pause-dialog"
				className="dropshadow"
				style={{ display: 'none' }}
			>
				<div className="dropshadow-background" />
				<i className="fa fa-pause-circle" />
			</div>
			<Router>
				<LobbyButton />
				<Switch>
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
					<Route path="/weapons">
						<Weapons />
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

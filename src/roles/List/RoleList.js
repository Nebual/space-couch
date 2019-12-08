import React from 'react';
import { Link } from 'react-router-dom';

import './RoleList.scss';

export default function RoleList() {
	return (
		<div className="container-list">
			<h1>Project Space Couch</h1>
			<div className="card-columns">
				<Link className="card card-block" to="captain">
					<h4 className="card-title">Captain</h4>
					<p className="card-text">
						Ensures smooth communication between crew.
					</p>
				</Link>
				<Link className="card card-block" to="engineer">
					<h4 className="card-title">Engineer</h4>
					<p className="card-text">
						Manages power levels throughout the ship.
					</p>
				</Link>
				<Link className="card card-block" to="robotics">
					<h4 className="card-title">Robotics Expert</h4>
					<p className="card-text">Head of HR - err, well</p>
				</Link>
				<Link className="card card-block" to="weapons">
					<h4 className="card-title">Weapons</h4>
					<p className="card-text">
						Fills the sky with lead - or lasers, as it may be
					</p>
				</Link>
				<Link className="card card-block" to="navigator">
					<h4 className="card-title">Navigator</h4>
					<p className="card-text">
						Figures out where we are, and where we're going.
					</p>
				</Link>
			</div>
		</div>
	);
}

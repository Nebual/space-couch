import React from 'react';
import { Link } from 'react-router-dom';

import './RoleList.scss';
import FullscreenButton from './FullscreenButton';

export default function RoleList() {
	return (
		<div className="container-list">
			<div style={{ display: 'flex' }}>
				<h1>Project Space Couch</h1>
				<FullscreenButton />
			</div>
			<div className="card-tiles">
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
					<h4 className="card-title">Robologistics</h4>
					<p className="card-text">Head of HR - err, well</p>
				</Link>
				<Link className="card card-block" to="weapons">
					<h4 className="card-title">Weapons</h4>
					<p className="card-text">
						Fills the sky with lead - or lasers, as it may be
					</p>
				</Link>
				<Link className="card card-block" to="radar">
					<h4 className="card-title">Radar</h4>
					<p className="card-text">
						The Eyes, Ears, and Nose of the Ship. Additionally, the
						thermal probe, Tachyon detector, and EM tuner.
					</p>
				</Link>
				<Link className="card card-block" to="/">
					<h4 className="card-title">Navigator</h4>
					<p className="card-text">
						Figures out where we are, and where we're going.
					</p>
				</Link>
			</div>
		</div>
	);
}

import React from 'react';
import { Link } from 'react-router-dom';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

import './RoleList.scss';
import ShipSelector from './ShipSelector';

function RoleCard({ to, title, children }) {
	return (
		<Link className="card" to={to}>
			<Card elevation={2}>
				<CardContent>
					<Typography variant="h5" gutterBottom>
						{title}
					</Typography>
					<Typography variant="body2">{children}</Typography>
				</CardContent>
			</Card>
		</Link>
	);
}

export default function RoleList() {
	return (
		<div className="container-list">
			<div style={{ display: 'flex' }}>
				<Typography variant="h3" gutterBottom>
					Space Couch
				</Typography>
				<ShipSelector />
			</div>
			<div className="card-tiles">
				<RoleCard to="captain" title="Captain">
					Ensures smooth communication between crew.
				</RoleCard>
				<RoleCard to="engineer" title="Engineer">
					Manages power levels throughout the ship.
				</RoleCard>
				<RoleCard to="robotics" title="Robologistics">
					Head of HR - err, well
				</RoleCard>

				<RoleCard to="weapons" title="Weapons">
					Fills the sky with lead - or lasers, as it may be
				</RoleCard>
				<RoleCard to="radar" title="Radar">
					The Eyes, Ears, and Nose of the Ship. Additionally, the
					thermal probe, Tachyon detector, and EM tuner.
				</RoleCard>
				<RoleCard to="/helm" title="Helmsman">
					Drives the boat, floors the accelerator
				</RoleCard>
				<RoleCard to="/" title="Navigator">
					Figures out where we are, and where we're going.
				</RoleCard>
			</div>
		</div>
	);
}

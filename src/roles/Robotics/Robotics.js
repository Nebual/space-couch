import React from 'react';

import './Robotics.scss';

export default function() {
	return (
		<div className="container-robotics">
			<div className="radial-overlay" />
			<ul id="robot-actions" className="radial-menu">
				<li data-type="extinguish">
					<i className="fa fa-3x fa-fire-extinguisher" />
				</li>
				<li data-type="repair">
					<img
						src="/images/tape.png"
						alt="tape"
						width="48"
						height="48"
					/>
				</li>
				<li data-type="replace">
					<i className="fa fa-3x fa-cogs" />
				</li>
				<li data-type="improve">
					<i className="fa fa-3x fa-wrench" />
				</li>
				<li>
					<i className="fa fa-3x fa-asl-interpreting" />
				</li>
				<li>
					<i className="fa fa-3x fa-wheelchair-alt" />
				</li>
			</ul>
			<div className="ship" />
		</div>
	);
}

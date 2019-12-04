import React from 'react';

import './Engineer.scss';

export default function() {
	const cards = [
		<div className="card">
			<h4 className="card-title">Main Power</h4>
			<div className="card-block">
				<div
					className="range-slider"
					data-vertical="true"
					data-sync="power1"
				/>
				<div
					className="range-slider"
					data-vertical="true"
					data-sync="power2"
				/>
				<div
					className="range-slider"
					data-vertical="true"
					data-sync="power3"
				/>
				<div
					className="range-slider"
					data-vertical="true"
					data-sync="power4"
				/>
				<div className="gaugewrap">
					<div className="gauge">
						<div className="dial">
							<div className="indicator" />
							<i />
							<div className="dialbase">
								<output>0</output>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>,
		<div className="card">
			<h4 className="card-title">Buttons</h4>
			<div className="card-block">
				<button
					type="button"
					className="btn btn-danger active-green"
					data-toggle="button"
					data-sync="main_power_system"
					aria-pressed="false"
				>
					<i className="fa fa-2x fa-power-off" />
				</button>
				<button
					type="button"
					className="btn btn-danger"
					data-toggle="button"
					data-sync="enable_doritos"
					aria-pressed="false"
				>
					<i className="fa fa-2x fa-hand-lizard-o" />
				</button>
				<br />
				<br />
				<button
					type="button"
					className="btn btn-warning"
					data-sync="flush_gravity"
					aria-pressed="false"
				>
					<i className="fa fa-2x fa-viacoin" />
				</button>
				<button
					type="button"
					className="btn btn-warning"
					data-sync="start_generator_fire"
				>
					<i className="fa fa-2x fa-fire" />
				</button>
				<button
					type="button"
					className="btn btn-warning"
					data-sync="break_shields"
				>
					<i className="fa fa-2x fa-ban" />
				</button>
			</div>
		</div>,

		<div className="card">
			<div className="console">
				&gt; tail -f /var/log/ship/network.log
			</div>
		</div>,
	];
	return (
		<div className="container-engineer">
			<div className="cards">
				{cards.map((card, index) => (
					<React.Fragment key={index}>{card}</React.Fragment>
				))}
			</div>
		</div>
	);
}

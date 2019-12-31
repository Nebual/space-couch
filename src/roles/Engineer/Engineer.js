import React, { useState } from 'react';

import './Engineer.scss';
import RangeSlider from './RangeSlider';
import RadialGauge from './RadialGauge';
import ButtonSync from './ButtonSync';
import Console from './Console';
import CardDeck from './CardDeck';
import Typography from '@material-ui/core/Typography';

export default function Engineer() {
	const [power2, setPower2] = useState(0);
	const [power3, setPower3] = useState(20);

	const cards = [
		<>
			<Typography variant="h5" className="card-title">
				Main Power
			</Typography>
			<div className="card-block">
				<div className="slider-gauge-wrapper">
					<RadialGauge
						syncId="powerBuffer:reactor"
						suffix="%"
						inverted
						small
					/>
					<RangeSlider syncId="power1" />
				</div>
				<RangeSlider
					syncId="power2"
					initialValue={power2}
					onChange={setPower2}
					syncDelay={125}
				/>
				<div className="slider-gauge-wrapper">
					<RadialGauge
						syncId="powerBuffer:thrusters"
						suffix="%"
						inverted
						small
					/>
					<RangeSlider
						syncId="powerBufferSlider:thrusters"
						initialValue={power3}
						onChange={setPower3}
					/>
				</div>
				<div className="slider-gauge-wrapper">
					<RadialGauge
						syncId="powerBuffer:heatDetector"
						suffix="%"
						inverted
						small
					/>
					<RangeSlider syncId="power4" />
				</div>
				<RadialGauge
					style={{
						position: 'absolute',
						top: '1em',
						right: '1em',
					}}
					value={(power2 + power3 * 1.5) / 2.5}
					suffix="°C"
				/>
			</div>
		</>,

		<>
			<Typography variant="h5" className="card-title">
				Buttons
			</Typography>
			<div className="card-block">
				<div>
					<ButtonSync
						className="btn btn-danger active-green"
						toggle
						syncId="main_power_system"
					>
						<i className="fa fa-2x fa-power-off" />
					</ButtonSync>
					<ButtonSync
						className="btn btn-danger"
						syncId="enable_doritos"
					>
						<i className="fa fa-2x fa-hand-lizard-o" />
					</ButtonSync>
				</div>
				<div style={{ marginTop: '1em' }}>
					<ButtonSync
						className="btn btn-warning"
						syncId="flush_gravity"
					>
						<i className="fa fa-2x fa-viacoin" />
					</ButtonSync>
					<ButtonSync
						className="btn btn-warning"
						syncId="start_generator_fire"
					>
						<i className="fa fa-2x fa-fire" />
					</ButtonSync>
					<ButtonSync
						className="btn btn-warning"
						syncId="break_shields"
					>
						<i className="fa fa-2x fa-ban" />
					</ButtonSync>
				</div>
			</div>
		</>,

		<Console />,
	];
	return <CardDeck className="container-engineer" cards={cards} />;
}

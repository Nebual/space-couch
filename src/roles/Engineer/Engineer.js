import React, { useState } from 'react';
import classNames from 'classnames';
import { useSwipeable } from 'react-swipeable';

import './Engineer.scss';
import RangeSlider from './RangeSlider';
import RadialGauge from './RadialGauge';
import ButtonSync from './ButtonSync';
import Console from './Console';

export default function() {
	const [currentCard, setCurrentCard] = useState(0);

	const [power2, setPower2] = useState(0);
	const [power3, setPower3] = useState(20);

	const swipeableHandlers = useSwipeable({
		onSwipedLeft: () =>
			setCurrentCard(1 + Math.min(cards.length, currentCard)),
		onSwipedRight: () => setCurrentCard(Math.max(0, currentCard - 1)),
		preventDefaultTouchmoveEvent: true,
		trackMouse: true,
	});
	const cards = [
		<div className="card">
			<h4 className="card-title">Main Power</h4>
			<div className="card-block">
				<RangeSlider syncId="power1" />
				<RangeSlider
					syncId="power2"
					initialValue={power2}
					onChange={setPower2}
					syncDelay={125}
				/>
				<RangeSlider
					syncId="power3"
					initialValue={power3}
					onChange={setPower3}
				/>
				<RangeSlider syncId="power4" />
				<RadialGauge
					style={{
						position: 'absolute',
						top: '1em',
						right: '1em',
					}}
					value={(power2 + power3 * 1.5) / 2.5}
				/>
			</div>
		</div>,
		<div className="card">
			<h4 className="card-title">Buttons</h4>
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
		</div>,

		<div className="card">
			<Console />
		</div>,
	];
	return (
		<div className="container-engineer" {...swipeableHandlers}>
			{cards.map((card, index) => (
				<div
					className={classNames(
						'height-100',
						index !== currentCard && 'hidden'
					)}
					key={index}
				>
					{card}
				</div>
			))}
		</div>
	);
}

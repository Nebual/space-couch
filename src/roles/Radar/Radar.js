import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import './Radar.scss';
import RadarGraph from './RadarGraph';
import { useInterval } from '../../Util';
import Typography from '@material-ui/core/Typography';
import ButtonPush from './ButtonPush';

export default function Radar() {
	const [currentCard, setCurrentCard] = useState(0);
	const [temperatureData, setTemperatureData] = useState([]);
	const sensorFuzz = 1.0;
	const refreshRandomData = () => {
		setTemperatureData(
			[
				0.5,
				0.6,
				0.5,
				3,
				6,
				7,
				2,
				1.5,
				1.3,
				1.4,
				2,
				9.3,
				0.5,
				0.7,
				0.3,
				0.3,
				0.7,
				1.5,
				0.4,
				1.8,
			].map(val => val + Math.random() * sensorFuzz)
		);
	};
	useInterval(refreshRandomData, 1000);
	useEffect(refreshRandomData, []);

	const tachyonBaseline = 0.02 + Math.random() * 0.03;
	const tachyonData = [
		...Array(4).fill(tachyonBaseline),
		Math.sin(Date.now() / 2215) > 0.5
			? Math.sin(Date.now() / 2215)
			: tachyonBaseline,
		Math.sin(Date.now() / 2215) > 0.5
			? Math.sin(Date.now() / 2215) * 0.7 +
			  Math.sin(Date.now() / 2101) * 0.3
			: tachyonBaseline,
		...Array(14).fill(tachyonBaseline),
	];
	const cards = [
		<>
			<Typography variant="h5" className="card-title">
				Thermal Scans
			</Typography>
			<div className="card-block">
				<RadarGraph
					numRings={3}
					width={250}
					height={250}
					color="red"
					pointRadius={0}
					data={temperatureData}
					dataMax={10}
				/>
			</div>
		</>,
		<>
			<Typography variant="h5" className="card-title">
				Tachyon Detector
			</Typography>
			<div className="card-block">
				<RadarGraph
					numRings={3}
					width={250}
					height={250}
					color="blue"
					pointRadius={0}
					data={tachyonData}
					dataMax={1}
				/>
			</div>
		</>,
	];
	return (
		<div className="container-radar">
			<div className="button-column" style={{ alignItems: 'flex-end' }}>
				<ButtonPush onLongPress={() => setCurrentCard(0)} />
				<ButtonPush onLongPress={() => setCurrentCard(1)} />
				<ButtonPush />
				<ButtonPush />
			</div>
			{cards.map((card, index) => (
				<div
					className={classNames(
						'card',
						index !== currentCard && 'hidden'
					)}
					key={index}
				>
					{card}
				</div>
			))}
			<div className="button-column" style={{ alignItems: 'flex-start' }}>
				<ButtonPush />
				<ButtonPush />
				<ButtonPush />
				<ButtonPush />
			</div>
		</div>
	);
}

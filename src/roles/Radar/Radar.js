import React, { useEffect, useState } from 'react';
// import { LineChart } from 'recharts';

import './Radar.scss';
import CardDeck from '../Engineer/CardDeck';
import RadarGraph from './RadarGraph';

export default function Radar() {
	const [temperatureData, setTemperatureData] = useState([]);
	const sensorFuzz = 1.0;
	useEffect(() => {
		const intervalID = setInterval(() => {
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
		}, 1000);
		return () => clearInterval(intervalID);
	}, []);

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
			<h4 className="card-title">Thermal Scans</h4>
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
			<h4 className="card-title">Tachyon Detector</h4>
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
	return <CardDeck className="container-radar" cards={cards} />;
}
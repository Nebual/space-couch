import React from 'react';
import { Group } from '@vx/group';
import { scaleLinear } from '@vx/scale';
import { Point } from '@vx/point';
import { Line, LineRadial } from '@vx/shape';
import Color from 'color';

const lineColor = '#d9d9d9';
const ANG = 360;
const sampleData = [
	0.02782,
	0.04253,
	0.12702,
	0.02288,
	0.02015,
	0.06094,
	0.06966,
	0.00153,
	0.00772,
	0.04025,
	0.02406,
	0.06749,
	0.07507,
	0.01929,
	0.00095,
];

export default ({
	data = sampleData,
	dataMax = Math.max(...data),
	width,
	height,
	numRings = 5,
	pointRadius = 4,
	color = '#f5810c',
}) => {
	const radius = Math.min(width, height) / 2;

	const radiusScale = scaleLinear({
		range: [0, Math.PI * 2],
		domain: [ANG, 0],
	});

	const yScale = scaleLinear({
		range: [0, radius],
		domain: [0, dataMax],
	});

	const webs = genAngles(data.length);
	const points = genPoints(data.length, radius);
	const polygonPoints = genPolygonPoints(data, yScale);
	const zeroPoint = new Point({ x: 0, y: 0 });

	const polygonColor = Color(color).lighten(0.2);

	return (
		<svg width={width} height={height}>
			<Group top={height / 2} left={width / 2}>
				{[...Array(numRings)].map((_, i) => {
					const r = ((i + 1) * radius) / numRings;
					return (
						<LineRadial
							key={`web-${i}`}
							data={webs}
							angle={d => radiusScale(d.angle)}
							radius={r}
							fill="none"
							stroke={lineColor}
							strokeWidth={2}
							strokeOpacity={0.8}
							strokeLinecap="round"
						/>
					);
				})}
				{[...Array(data.length)].map((_, i) => (
					<Line
						key={`radar-line-${i}`}
						from={zeroPoint}
						to={points[i]}
						stroke={lineColor}
					/>
				))}
				<polygon
					points={polygonPoints.polygon}
					fill={polygonColor}
					fillOpacity={0.3}
					stroke={polygonColor}
					strokeWidth={1}
				/>
				{pointRadius &&
					polygonPoints.map((point, i) => (
						<circle
							key={`radar-point-${i}`}
							cx={point.x}
							cy={point.y}
							r={pointRadius}
							fill={color}
						/>
					))}
			</Group>
		</svg>
	);
};

function genAngles(length) {
	return [...Array(length + 1)].map((_, i) => ({
		angle: i * (ANG / length),
	}));
}

function genPoints(length, radius) {
	const step = (Math.PI * 2) / length;
	return [...Array(length)].map((_, i) => ({
		x: radius * Math.sin(i * step),
		y: radius * Math.cos(i * step),
	}));
}

function genPolygonPoints(data, scale) {
	const step = (Math.PI * 2) / data.length;
	const points = new Array(data.length).fill({});
	points.polygon = new Array(data.length + 1).fill('').reduce((res, _, i) => {
		if (i > data.length) return res;
		const x = scale(data[i - 1]) * Math.sin(i * step);
		const y = scale(data[i - 1]) * Math.cos(i * step);
		points[i - 1] = { x, y };
		return (res += `${x},${y} `);
	});
	return points;
}

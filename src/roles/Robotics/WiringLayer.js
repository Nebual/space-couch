import React from 'react';

import Color from 'color';
import { Line } from '@vx/shape';
import { Point } from '@vx/point';
import { NODE_SIZE } from './Robotics';

const WIRE_START_COLOUR = 'yellowgreen';
const WIRE_END_COLOUR = Color(WIRE_START_COLOUR).darken(0.5);

export default function WiringLayer({ subsystems, width, height }) {
	return (
		<svg
			width={width}
			height={height}
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				pointerEvents: 'none',
			}}
		>
			<defs>
				<linearGradient
					id="wireGradient"
					gradientUnits="objectBoundingBox"
				>
					<stop offset="0" stopColor={WIRE_END_COLOUR} />
					<stop offset="1" stopColor={WIRE_START_COLOUR} />
				</linearGradient>
				<linearGradient
					id="wireGradientReverse"
					gradientUnits="objectBoundingBox"
				>
					<stop offset="0" stopColor={WIRE_START_COLOUR} />
					<stop offset="1" stopColor={WIRE_END_COLOUR} />
				</linearGradient>
			</defs>
			{Object.values(subsystems).map(subsystem => {
				const source = subsystems[subsystem.sources[0]];
				if (!source) {
					return null;
				}
				const from = {
					x: (source.position.x + 0.5) * NODE_SIZE,
					y: (source.position.y + 0.5) * NODE_SIZE,
				};
				const to = {
					x: (subsystem.position.x + 0.5) * NODE_SIZE - 1,
					y: (subsystem.position.y + 0.5) * NODE_SIZE + 1,
				};
				return (
					<Line
						key={subsystem.id}
						from={new Point(from)}
						to={new Point(to)}
						stroke={
							from.x < to.x
								? 'url(#wireGradient)'
								: 'url(#wireGradientReverse)'
						}
						strokeWidth={4}
						strokeLinecap="round"
					/>
				);
			})}
		</svg>
	);
}

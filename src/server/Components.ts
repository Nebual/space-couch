import { createComponentClass } from 'ecsy';

export const Position = createComponentClass<iPosition>(
	{
		x: { default: 0 },
		y: { default: 0 },
	},
	'Position'
);
interface iPosition {
	x: number;
	y: number;
}

export const Velocity = createComponentClass<iVelocity>(
	{
		x: { default: 0 },
		y: { default: 0 },
	},
	'Velocity'
);
interface iVelocity {
	x: number;
	y: number;
}

export const Emission = createComponentClass<iEmission>(
	{
		type: { default: 'heat' },
		strength: { default: 0 },
		strengthRate: { default: -1 },
		radius: { default: 0 },
		radiusRate: { default: 1000 / 20 },
	},
	'Emission'
);
interface iEmission {
	type: string;
	strength: number;
	strengthRate: number;
	radius: number;
	radiusRate: number;
}

export const Emitter = createComponentClass<iEmitter>(
	{
		type: { default: 'heat' },
		strength: { default: 0 },
		strengthRate: { default: -1 },
		radiusRate: { default: 1000 / 20 },
	},
	'Emitter'
);
interface iEmitter {
	type: string;
	strength: number;
	strengthRate: number;
	radiusRate: number;
}

export const EmissionDetector = createComponentClass<iEmissionDetector>(
	{
		type: { default: 'heat' },
		strength: { default: 1 },
		direction: { default: 'all' },
		nextScanTime: { default: 0 },
	},
	'EmissionDetector'
);
interface iEmissionDetector {
	type: string;
	strength: number;
	direction: 'all' | number;
	nextScanTime: number;
}

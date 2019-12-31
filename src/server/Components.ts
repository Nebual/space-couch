import { createComponentClass, Entity } from 'ecsy';

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
		strengthRate: { default: 0 },
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

export const SyncId = createComponentClass<iSyncId>(
	{ value: { default: '' } },
	'SyncId'
);
interface iSyncId {
	value: string;
}

export const ShipPosition = createComponentClass<iShipPosition>(
	{
		x: { default: 0 },
		y: { default: 0 },
	},
	'ShipPosition'
);
interface iShipPosition {
	x: number;
	y: number;
}

export const PowerBuffer = createComponentClass<iPowerBuffer>(
	{
		current: { default: 0 },
		max: { default: 0 },
		rate: { default: 10 },
		maxRate: { default: 100 },
		sinks: { default: [] },
		sources: { default: [] },
	},
	'PowerBuffer'
);
interface iPowerBuffer {
	current: number;
	max: number;
	rate: number;
	maxRate: number;
	sinks: number[];
	sources: Entity[];
}

export const PowerProducer = createComponentClass<iPowerProducer>(
	{
		rate: { default: 0 },
		maxRate: { default: 1000 },
		on: { default: true },
	},
	'PowerProducer'
);
interface iPowerProducer {
	rate: number;
	maxRate: number;
	on: boolean;
}

export const PowerConsumer = createComponentClass<iPowerConsumer>(
	{
		rate: { default: 10 },
		on: { default: true },
		powered: { default: true },
		installed: { default: true },
	},
	'PowerConsumer'
);
interface iPowerConsumer {
	rate: number;
	on: boolean;
	powered: boolean;
	installed: boolean;
}

export const ModuleTemperature = createComponentClass<iModuleTemperature>(
	{
		temperature: { default: 20 },
	},
	'ModuleTemperature'
);
interface iModuleTemperature {
	temperature: number;
}

export const RenderableInterior = createComponentClass<iRenderableInterior>(
	{
		image: { default: '' },
	},
	'RenderableInterior'
);
interface iRenderableInterior {
	image: string;
}

export const GravitationalMass = createComponentClass<iGravitationalMass>(
	{
		gravitons: { default: 1000 },
	},
	'GravitationalMass'
);
interface iGravitationalMass {
	gravitons: number;
}

const safeTypes = {
	number: true,
	boolean: true,
	string: true,
};
export const serializeComponentValue = val => {
	if (safeTypes[typeof val]) {
		return val;
	}
	if (Array.isArray(val)) {
		return val.map(serializeComponentValue);
	}
	if (
		typeof val === 'object' &&
		(val as Entity).hasComponent &&
		(val as Entity).hasComponent(SyncId)
	) {
		return 'SyncId:' + (val as Entity).getComponent(SyncId).value;
	}
	return null;
};

export const deserializeCompValue = (
	shipEntities: { [key: string]: Entity },
	val
) => {
	if (Array.isArray(val)) {
		return val.map(val2 => deserializeCompValue(shipEntities, val2));
	}
	if (typeof val === 'string' && val.substr(0, 7) === 'SyncId:') {
		const syncId = val.substr(7);
		return Object.values(shipEntities).find(
			ent => ent.getComponent(SyncId)?.value === syncId
		);
	}
	return val;
};

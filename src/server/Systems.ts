import { Entity, System } from 'ecsy';
import { Emission, EmissionDetector, Position, Velocity } from './Components';
import { ServerNet } from './ServerNet';

export class MovableSystem extends System {
	execute(delta, time) {
		this.queries.moving.results.forEach((entity: Entity) => {
			let velocity = entity.getComponent(Velocity);
			let position = entity.getMutableComponent(Position);
			position.x += velocity.x * delta;
			position.y += velocity.y * delta;
		});
	}
}
MovableSystem.queries = {
	moving: {
		components: [Velocity, Position],
	},
};

export class EmissionSystem extends System {
	execute(delta, time) {
		this.queries.emissions.results.forEach((entity: Entity) => {
			let emission = entity.getMutableComponent(Emission);
			emission.strength += emission.strengthRate * delta;
			emission.radius += emission.radiusRate * delta;
			if (emission.strength <= 0) {
				entity.remove();
			}
		});
	}
}
EmissionSystem.queries = {
	emissions: {
		components: [Emission],
	},
};

export class EmissionDetectorSystem extends System {
	private getNet: () => ServerNet;
	constructor(world, attributes) {
		// @ts-ignore
		super(world, attributes);
		this.getNet = attributes.getNet;
	}
	execute(delta, time) {
		this.queries.emissionDetectors.results.forEach((detector: Entity) => {
			const emissionDetector = detector.getMutableComponent(
				EmissionDetector
			);
			if (emissionDetector.nextScanTime > time) {
				return;
			}
			emissionDetector.nextScanTime = time + 1;
			const detectorType = emissionDetector.type;
			const resolution = 24;

			const detectorPos = detector.getComponent(Position);

			// todo: omnitype results aggregation
			const radarResults = [...new Array(resolution)].map(
				() => Math.max(2, Math.sin(time * 7.21) * 6) + Math.random() * 4
			);
			this.queries.emissions.results.forEach((emissionEntity: Entity) => {
				const emission = emissionEntity.getComponent(Emission);
				if (detectorType !== 'all' && emission.type !== detectorType) {
					return;
				}

				const emissionPos = emissionEntity.getComponent(Position);
				const distance = distance2D(detectorPos, emissionPos);
				if (distance > emission.radius) {
					return;
				}

				const ang = angle2D(detectorPos, emissionPos);
				const compassIndex = radsToCompass(ang, resolution);
				radarResults[compassIndex] += emission.strength;
			});
			this.getNet().broadcast(
				{
					event: 'radar_data',
					id: detectorType,
					value: radarResults,
				},
				'radar'
			);
		});
	}
}
EmissionDetectorSystem.queries = {
	emissions: {
		components: [Position, Emission],
	},
	emissionDetectors: {
		components: [Position, EmissionDetector],
	},
};

function distance2D({ x: x1, y: y1 }, { x: x2, y: y2 }): number {
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
function angle2D({ x: x1, y: y1 }, { x: x2, y: y2 }): number {
	return Math.atan2(y2 - y1, x2 - x1); // returns in rads
}
function radsToCompass(angRads, resolution): number {
	const angPercent = (angRads / (2 * Math.PI) + 0.75) % 1;
	return Math.round(angPercent * resolution);
}

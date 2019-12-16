import { Entity, System } from 'ecsy';
import SimplexNoise from 'simplex-noise';
import {
	Emission,
	EmissionDetector,
	Position,
	PowerBuffer,
	PowerConsumer,
	PowerProducer,
	SyncId,
	Velocity,
} from './Components';
import { GameWorld } from './Game';

abstract class GameSystem extends System<GameWorld> {}

export class MovableSystem extends GameSystem {
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

export class EmissionSystem extends GameSystem {
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

export class EmissionDetectorSystem extends GameSystem {
	private simplex: SimplexNoise;
	init() {
		this.simplex = new SimplexNoise();
	}
	broadcastRadar(detectorType, values) {
		this.world
			.getNet()
			.broadcast(
				{ event: 'radar_data', id: detectorType, value: values },
				'radar'
			);
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

			const detectorConsumer = detector.getComponent(PowerConsumer);
			if (!detectorConsumer.powered || !detectorConsumer.on) {
				return;
			}

			const detectorType = emissionDetector.type;
			const resolution = 24;

			const detectorPos = detector.getComponent(Position);

			// todo: omnitype results aggregation
			const radarResults = [...new Array(resolution)].map((_, i) => {
				const x = Math.sin(i * 4);
				const y = Math.cos(i * 6);
				return (this.simplex.noise3D(x, y, time / 5) + 1) * 5 + 2;
			});
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
			this.broadcastRadar(detectorType, radarResults);
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

export class PowerProductionSystem extends GameSystem {
	execute(delta, time) {
		this.queries.producers.results.forEach((entity: Entity) => {
			const producer = entity.getComponent(PowerProducer);
			if (!producer.on) {
				return;
			}
			const buffer = entity.getMutableComponent(PowerBuffer);

			buffer.current = Math.min(
				buffer.current + producer.rate * delta,
				buffer.max
			);
		});
	}
}
PowerProductionSystem.queries = {
	producers: {
		components: [PowerProducer, PowerBuffer],
	},
};

export class PowerConsumptionSystem extends GameSystem {
	execute(delta, time) {
		this.queries.consumers.results.forEach((entity: Entity) => {
			const consumer = entity.getMutableComponent(PowerConsumer);
			if (!consumer.on) {
				return;
			}
			const buffer = entity.getMutableComponent(PowerBuffer);

			const subtracted = consumer.rate * delta;
			consumer.powered = buffer.current > subtracted;
			if (consumer.powered) {
				buffer.current -= subtracted;
			}
		});
	}
}
PowerConsumptionSystem.queries = {
	consumers: {
		components: [PowerConsumer, PowerBuffer],
	},
};

export class PowerFlowSystem extends GameSystem {
	execute(delta, time) {
		this.queries.buffers.results.forEach((entity: Entity) => {
			const buffer = entity.getMutableComponent(PowerBuffer);

			buffer.sources.forEach(sourceEnt => {
				if (buffer.current >= buffer.max) {
					return;
				}
				const sourceBuffer = sourceEnt.getMutableComponent(PowerBuffer);
				const requested = Math.min(
					buffer.max - buffer.current,
					buffer.rate * delta,
					sourceBuffer.current
				);
				sourceBuffer.current -= requested;
				buffer.current += requested;
			});
			const syncId = entity.getComponent(SyncId)?.value;
			if (syncId) {
				this.world
					.getNet()
					.broadcastStateThrottled(
						'powerBuffer:' + syncId,
						buffer.current / buffer.max,
						'engineer',
						500
					);
			}
		});
	}
}
PowerFlowSystem.queries = {
	buffers: {
		components: [PowerBuffer],
	},
};

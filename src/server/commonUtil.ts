export const objectMap = (obj, fn) =>
	Object.fromEntries(
		Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)])
	);

let throttles: {
	[id: string]: {
		timer?: any;
		func?: () => void;
		nextTime: number;
	};
} = {};

export function throttle(
	id: string,
	func: { (): void },
	delay_ms: number
): void {
	let time = Date.now();

	if ((throttles[id]?.nextTime || 0) < time) {
		func();
		clearTimeout(throttles[id]?.timer);
		throttles[id] = {
			nextTime: time + delay_ms,
		};
	} else {
		throttles[id].func = func;
		if (!throttles[id].timer) {
			throttles[id].timer = setTimeout(() => {
				// @ts-ignore
				throttles[id].func();
				delete throttles[id];
			}, throttles[id].nextTime - time);
		}
	}
}

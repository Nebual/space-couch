import { useEffect, useRef } from 'react';
import { throttle } from './server/commonUtil';

export { throttle };

export function vibrate(ms: number) {
	const browserVibrate = (
		navigator.vibrate ||
		(navigator as any).webkitVibrate ||
		(navigator as any).mozVibrate ||
		(navigator as any).msVibrate
	).bind(navigator);
	if (!browserVibrate) return; // unsupported
	browserVibrate(ms || 200);
}

export function useInterval(callback, delay) {
	const savedCallback = useRef();

	// Remember the latest callback.
	savedCallback.current = callback;

	// Set up the interval.
	useEffect(() => {
		function tick() {
			if (savedCallback.current !== undefined) {
				// @ts-ignore
				savedCallback.current();
			}
		}
		if (delay !== null) {
			let id = setInterval(tick, delay);
			return () => clearInterval(id);
		}
	}, [delay]);
}

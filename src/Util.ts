let throttleTimers: { [id: string]: number } = {};
export function throttle(
	id: string,
	func: { (): void },
	delay_ms: number
): void {
	let now = Date.now();
	if (now > (throttleTimers[id] || 0)) {
		throttleTimers[id] = now + delay_ms;
		setTimeout(func, delay_ms);
	}
}

navigator.vibrate =
	navigator.vibrate ||
	(navigator as any).webkitVibrate ||
	(navigator as any).mozVibrate ||
	(navigator as any).msVibrate;
export function vibrate(ms: number) {
	if (!navigator.vibrate) return; // unsupported
	navigator.vibrate(ms || 200);
}

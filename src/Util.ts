let throttleTimers: { [id: string]: number } = {};
// todo: replace this with a library, it runs the older version of func() :(
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

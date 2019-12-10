let throttleTimers: { [id: string]: number } = {};
// todo: replace this with a library, it runs the older version of func() :(
export default function throttle(
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

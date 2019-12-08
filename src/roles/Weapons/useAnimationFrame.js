import React from 'react';

export default function useAnimationFrame(callback) {
	const requestRef = React.useRef(null);
	const previousTimeRef = React.useRef(null);

	React.useEffect(() => {
		const animate = time => {
			if (previousTimeRef.current !== undefined) {
				const deltaTime = time - previousTimeRef.current;
				callback(deltaTime);
			}
			previousTimeRef.current = time;
			requestRef.current = requestAnimationFrame(animate);
		};
		requestRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(requestRef.current);
	}, [callback]);
}

import { useEffect, useState } from 'react';

const isClient = typeof window === 'object';

function getSize() {
	return {
		width: isClient ? window.innerWidth : undefined,
		height: isClient ? window.innerHeight : undefined,
	};
}

export default function useWindowSize() {
	const [windowSize, setWindowSize] = useState(getSize);

	useEffect(() => {
		if (!isClient) {
			return false;
		}

		function handleResize() {
			setWindowSize(getSize());
		}

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return windowSize;
}

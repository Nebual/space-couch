import { useEffect, useRef, useState } from 'react';
import TouchHandler from 'react-touch/lib/TouchHandler';

export default function useTouchHandler(
	startHandler,
	moveHandler,
	stopHandler
) {
	const [touchHandler, setTouchHandler] = useState(null);
	const startRef = useRef(startHandler);
	const moveRef = useRef(moveHandler);
	const stopRef = useRef(stopHandler);

	startRef.current = startHandler;
	moveRef.current = moveHandler;
	stopRef.current = stopHandler;

	useEffect(() => {
		const newTouchHandler = new TouchHandler(
			(...args) => startRef.current(...args),
			(...args) => moveRef.current(...args),
			(...args) => stopRef.current(...args)
		);
		setTouchHandler(newTouchHandler);
		return () => newTouchHandler.removeListeners();
	}, []);

	return touchHandler && touchHandler.listeners({ props: {} });
}

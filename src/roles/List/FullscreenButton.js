import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { useInterval } from '../../Util';

export default function FullscreenButton() {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useInterval(() => {
		setIsFullscreen(
			document.fullscreenElement ||
				document.mozFullScreenElement ||
				document.webkitFullscreenElement
		);
	}, 500);
	const toggleFullscreen = async () => {
		try {
			if (!isFullscreen) {
				await document.documentElement.requestFullscreen();

				window.screen.lockOrientationUniversal =
					window.screen.lockOrientation ||
					window.screen.mozLockOrientation ||
					window.screen.msLockOrientation ||
					window.screen.orientation.lock.bind(
						window.screen.orientation
					);
				await window.screen.lockOrientationUniversal('landscape');
			} else {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
			}
		} catch (e) {
			console.log('Fullscreen Launch error:', e);
		}
	};
	return (
		<Button
			variant={isFullscreen ? 'text' : 'contained'}
			onClick={toggleFullscreen}
			style={{ marginLeft: 'auto' }}
		>
			Fullscreen
		</Button>
	);
}

import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import { useInterval } from '../../Util';
import useWindowSize from '../../components/useWindowSize';
import { useHistory } from 'react-router-dom';

export default function FullscreenButton() {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const isDesktop = useWindowSize().width > 1200;
	const history = useHistory();
	const allowPortrait = history.location.pathname === '/helm';

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
				if (!allowPortrait) {
					await window.screen.lockOrientationUniversal('landscape');
				}
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
		!isFullscreen &&
		!isDesktop && (
			<div className="fullscreen-button-container">
				<Button
					variant={isFullscreen ? 'text' : 'contained'}
					onClick={toggleFullscreen}
					className="fullscreen-button"
					size="large"
				>
					Fullscreen
				</Button>
			</div>
		)
	);
}

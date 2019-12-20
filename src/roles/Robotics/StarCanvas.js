import React, { useCallback, useEffect, useRef, useState } from 'react';

import './StarCanvas.scss';
import useAnimationFrame from '../../components/useAnimationFrame';
import useWindowSize from '../../components/useWindowSize';

const numBgLayers = 12;
const baseStartNum = 10;
const starLayerMultiplier = 5;
const CIRCLE_THRESHOLD = 1.12;
const baseStarRadius = 1.2;
const parallaxStrength = 1 / 2;
const panSpeed = -0.3;

export default function StarCanvas() {
	const canvasRef = useRef();
	const camXRef = useRef(0);
	const getCtx = () => canvasRef.current.getContext('2d');
	const [bgLayers, setBgLayers] = useState([]);

	const { width: canvasWidth, height: canvasHeight } = useWindowSize();

	const init = () => {
		let newBgLayers = [];
		for (let i = numBgLayers; i > 0; i--) {
			let stars = [];
			for (let j = 0; j < baseStartNum * i * starLayerMultiplier; j++) {
				stars.push({
					x: getRandomInt(0, canvasWidth),
					y: getRandomInt(0, canvasHeight),
					radius: Math.round((baseStarRadius / i) * 100) / 100,
				});
			}
			newBgLayers.push(stars);
		}
		setBgLayers(newBgLayers);

		console.log('bgLayers', newBgLayers);
	};
	useEffect(init, [canvasWidth, canvasHeight]);

	const render = useCallback(() => {
		function clearScreen(ctx, rect) {
			ctx.fillStyle = 'black';
			ctx.fillRect(0, 0, canvasWidth, canvasHeight);
		}

		const ctx = getCtx();

		clearScreen(ctx);

		camXRef.current += panSpeed;
		const camX = camXRef.current;
		const camY = 0;

		ctx.fillStyle = '#FFF';
		bgLayers.forEach(layer => {
			layer.forEach(star => {
				const xDepth = star.radius * camX * parallaxStrength;
				const yDepth = star.radius * camY * parallaxStrength;
				const starX = (star.x + xDepth + camX + 10000000) % canvasWidth;
				const starY =
					(star.y + yDepth + camY + 10000000) % canvasHeight;
				if (star.radius >= CIRCLE_THRESHOLD) {
					ctx.beginPath();
					ctx.arc(starX, starY, star.radius, 0, 2 * Math.PI, false);
					ctx.fill();
				} else {
					let pixelSize = star.radius * 3;
					ctx.fillRect(starX, starY, pixelSize, pixelSize);
				}
			});
		});
	}, [bgLayers, canvasHeight, canvasWidth]);
	useAnimationFrame(render);

	return (
		<canvas
			ref={canvasRef}
			className="StarCanvas"
			width={canvasWidth}
			height={canvasHeight}
		/>
	);
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

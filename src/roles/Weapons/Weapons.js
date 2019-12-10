import React, { useCallback, useEffect, useRef, useState } from 'react';
import Gyro from './gyro';

import './Weapons.scss';
import useAnimationFrame from './useAnimationFrame';
import { throttle } from '../../Util';

const reticleSize = 10;
const numBgLayers = 12;
const baseStartNum = 16;
const starLayerMultiplier = 5;
const CIRCLE_THRESHOLD = 1.12;
const baseStarRadius = 1.5;
const parallaxStrength = 1 / 6;

// Warning: Gyro _requires_ HTTPS! Otherwise the event silently never fires.
export default function Weapons() {
	const canvasRef = useRef();
	const getCtx = () => canvasRef.current.getContext('2d');
	const [bgLayers, setBgLayers] = useState([]);
	const [reticle, setReticle] = useState({});
	const [debugText, setDebugText] = useState('');

	const windowHeight = window.innerHeight;
	const windowWidth = window.innerWidth;
	const DEFAULT_HEIGHT = windowHeight * 4;
	const DEFAULT_WIDTH = windowWidth * 4;

	const init = () => {
		setReticle({
			x: windowWidth / 2 - reticleSize / 2,
			y: windowHeight / 2 - reticleSize / 2,
			sizeX: reticleSize,
			sizeY: reticleSize,
		});

		let newBgLayers = [];
		for (let i = numBgLayers; i > 0; i--) {
			let stars = [];
			for (let j = 0; j < baseStartNum * i * starLayerMultiplier; j++) {
				stars.push({
					x: getRandomInt(-DEFAULT_WIDTH / 2, DEFAULT_WIDTH / 2),
					y: getRandomInt(-DEFAULT_HEIGHT / 2, DEFAULT_HEIGHT / 2),
					radius: Math.round((baseStarRadius / i) * 100) / 100,
				});
			}
			newBgLayers.push(stars);
		}
		setBgLayers(newBgLayers);

		console.log('bgLayers', newBgLayers);
		render();
	};
	useEffect(init, [DEFAULT_WIDTH, DEFAULT_HEIGHT]);

	const render = useCallback(() => {
		function clearScreen(ctx, rect) {
			ctx.fillStyle = 'black';
			ctx.fillRect(
				-DEFAULT_WIDTH / 2,
				-DEFAULT_HEIGHT / 2,
				DEFAULT_WIDTH,
				DEFAULT_HEIGHT
			);
		}
		const gyroData = Gyro.getOrientation();
		const angle = calculateAngle(gyroData); // very questionable stuff

		// alpha: rotation around z-axis (360)
		// gamma: left to right (180)
		// beta: front back motion (90)

		throttle(
			'setDebugText',
			() =>
				setDebugText(
					debugNumbers({
						aA: angle.a,
						aG: angle.g,
						rawA: gyroData.alpha,
						rawB: gyroData.beta,
						rawG: gyroData.gamma,
					})
				),
			250
		);

		const ctx = getCtx();
		const canvas = canvasRef.current;

		ctx.setTransform(1, 0, 0, 1, 0, 0); //reset the transform matrix as it is cumulative
		ctx.clearRect(0, 0, canvas.width, canvas.height); //clear the viewport AFTER the matrix is reset

		//Clamp the camera position to the world bounds while centering the camera around the player
		function clamp(value, min, max) {
			if (value < min) return min;
			else if (value > max) return max;
			return value;
		}
		const worldMinMax = {
			minX: -DEFAULT_WIDTH / 2,
			minY: -DEFAULT_HEIGHT / 2,
			maxX: DEFAULT_WIDTH / 2,
			maxY: DEFAULT_HEIGHT / 2,
		};
		const camera = {
			x: -gyroData.beta * 6,
			y: gyroData.gamma * 6 + windowHeight,
		};
		const camX = clamp(
			-camera.x + canvas.width / 2,
			worldMinMax.minX,
			worldMinMax.maxX - canvas.width
		);
		const camY = clamp(
			-camera.y + canvas.height / 2,
			worldMinMax.minY,
			worldMinMax.maxY - canvas.height
		);

		ctx.translate(camX, camY);

		clearScreen(ctx);

		ctx.fillStyle = '#FFF';
		bgLayers.forEach(layer => {
			layer.forEach(star => {
				const xDepth = star.radius * camX * parallaxStrength;
				const yDepth = star.radius * camY * parallaxStrength;
				if (star.radius >= CIRCLE_THRESHOLD) {
					ctx.beginPath();
					ctx.arc(
						star.x + xDepth,
						star.y + yDepth,
						star.radius,
						0,
						2 * Math.PI,
						false
					);
					ctx.fill();
				} else {
					let pixelSize = star.radius * 3;
					ctx.fillRect(
						star.x + xDepth,
						star.y + yDepth,
						pixelSize,
						pixelSize
					);
				}
			});
		});

		//Aiming reticle
		ctx.fillStyle = 'red';
		ctx.fillRect(
			reticle.x - reticle.sizeX / 2 + Math.sin(Date.now() / 114) * 2,
			reticle.y - reticle.sizeY / 2 + Math.cos(Date.now() / 98) * 2,
			reticle.sizeX,
			reticle.sizeY
		);
	}, [reticle, bgLayers, DEFAULT_HEIGHT, DEFAULT_WIDTH, windowHeight]);
	useEffect(() => {
		Gyro.setupListeners();
		return Gyro.removeListeners;
	}, []);
	useAnimationFrame(render);

	return (
		<div className="container-weapons">
			<div className="weapons">
				<div id="weaponsCanvas">
					<canvas
						ref={canvasRef}
						width={windowWidth}
						height={windowHeight}
					/>
				</div>
				{debugText && (
					<div
						style={{
							width: '100px',
							color: 'white',
							position: 'fixed',
							top: '0px',
							right: '25px',
							textShadow:
								'-1px -1px 3px black, 1px -1px 3px black, -1px 1px 3px black, 1px 1px 3px black',
						}}
					>
						Debug: {debugText}
					</div>
				)}
			</div>
		</div>
	);
}

const debugNumbers = obj =>
	Object.keys(obj).map(key => (
		<div key={key}>
			{key}: {(obj[key] || -1).toFixed(1)}
		</div>
	));

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateAngle(o) {
	var g = 0;
	var a = 0;
	//The alpha value seems to change when the gamma value switches between negative and positive
	if (o.gamma >= 0) {
		a = Math.floor(o.alpha);
	} else {
		var alpha = Math.floor(o.alpha);
		if (alpha >= 0 && alpha < 180) {
			a = alpha + 180;
		} else {
			a = alpha - 180;
		}
	}

	//Top half
	if (o.gamma >= 0) {
		g = Math.floor(o.gamma);
	}
	//Bottom half
	else {
		g = 180 - Math.abs(Math.floor(o.gamma));
	}

	return { g: Math.floor(g), a: Math.floor(a) };
}

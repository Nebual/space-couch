import React, { useCallback, useEffect, useRef, useState } from 'react';
import Gyro from './gyro';
import * as BABYLON from 'babylonjs';

import './Weapons.scss';
import useAnimationFrame from './useAnimationFrame';
import { throttle } from '../../Util';
import RobotActionsMenu from '../Robotics/RobotActionsMenu';
import StarCanvas from '../Robotics/StarCanvas';
import GunnerView, { SceneEventArgs } from '../List/GunnerView';

const windowHeight = window.innerHeight;
const windowWidth = window.innerWidth;
const DEFAULT_HEIGHT = windowHeight * 4;
const DEFAULT_WIDTH = windowWidth * 4;

// Warning: Gyro _requires_ HTTPS! Otherwise the event silently never fires.
export default function Weapons() {
	const onSceneMount = (e: SceneEventArgs) => {
		const { canvas, scene, engine } = e;

		// This creates and positions a free camera (non-mesh)
		var camera = new BABYLON.FreeCamera(
			'camera1',
			new BABYLON.Vector3(0, 5, -10),
			scene
		);

		// This targets the camera to scene origin
		camera.setTarget(BABYLON.Vector3.Zero());

		// This attaches the camera to the canvas
		camera.attachControl(canvas, true);

		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		var light = new BABYLON.HemisphericLight(
			'light1',
			new BABYLON.Vector3(0, 1, 0),
			scene
		);

		// Default intensity is 1. Let's dim the light a small amount
		light.intensity = 0.7;

		// Our built-in 'sphere' shape. Params: name, subdivs, size, scene
		var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

		// Move the sphere upward 1/2 its height
		sphere.position.y = 1;

		// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
		var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);

		engine.runRenderLoop(() => {
			if (scene) {
				scene.render();
			}
		});
	};

	return (
		<div>
			<GunnerView onSceneMount={onSceneMount} />
		</div>
	);
}

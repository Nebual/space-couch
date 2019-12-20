import React, { useState } from 'react';
import * as BABYLON from 'babylonjs';
import './Weapons.scss';
import GunnerView, { SceneEventArgs } from '../List/GunnerView';
import useWindowSize from '../Robotics/useWindowSize';

// Warning: Gyro _requires_ HTTPS! Otherwise the event silently never fires.
export default function Weapons() {
	const onSceneMount = (e: SceneEventArgs) => {
		const { canvas, scene, engine } = e;

		const camera = new BABYLON.DeviceOrientationCamera(
			'camera1',
			new BABYLON.Vector3(0, 5, -10),
			scene
		);
		camera.attachControl(canvas, true);
		camera.setTarget(BABYLON.Vector3.Zero());

		// This creates a light, aiming 0,1,0 - to the sky (non-mesh)
		var light = new BABYLON.HemisphericLight(
			'light1',
			new BABYLON.Vector3(0, 1, 0),
			scene
		);

		// Default intensity is 1. Let's dim the light a small amount
		light.intensity = 0.8;

		// Our built-in 'sphere' shape. Params: name, subdivs, size, scene
		var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);

		// Move the sphere upward 1/2 its height
		sphere.position.y = 1;

		// Our built-in 'ground' shape. Params: name, width, depth, subdivs, scene
		var ground = BABYLON.Mesh.CreateGround('ground1', 6, -2, 2, scene);
		var planarMaterial = new BABYLON.StandardMaterial(
			'planarMaterial',
			scene
		);
		planarMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);

		ground.material = planarMaterial;

		engine.runRenderLoop(() => {
			if (scene) {
				scene.render();
			}
		});
	};

	const [container, setContainer] = useState();
	useWindowSize(); // triggers rerenders onresize
	const width = container ? container.getBoundingClientRect().width : 640;
	const height = container ? container.getBoundingClientRect().height : 360;

	return (
		<div ref={setContainer} className="container-weapons">
			<GunnerView
				onSceneMount={onSceneMount}
				width={width}
				height={height}
			/>
		</div>
	);
}

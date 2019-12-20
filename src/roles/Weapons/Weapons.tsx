//import React, { useCallback, useEffect, useRef, useState } from 'react';
import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';
import './Weapons.scss';
import GunnerView, { SceneEventArgs } from '../List/GunnerView';

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

		// This attaches the camera to the canvas
		camera.attachControl(canvas, true);

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

		// This targets the camera to scene origin
		camera.setTarget(BABYLON.Vector3.Zero());

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
	const containerRef = useRef(null);
	// @ts-ignore
	const containerY = containerRef.current?.innerHeight;
	// @ts-ignore
	const [arbitrary, setArbitrary] = useState(0);
	useEffect(() => {
		setArbitrary(1);
	}, []);

	return (
		<div ref={containerRef} style={{ height: '100%' }}>
			<GunnerView
				onSceneMount={onSceneMount}
				// @ts-ignore
				width={640} //<<<hardcoded x and y
				height={360}
			/>
		</div>
	);
}

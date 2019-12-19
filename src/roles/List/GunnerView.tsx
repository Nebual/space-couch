import * as BABYLON from 'babylonjs';
import React from 'react';

export type SceneEventArgs = {
	engine: BABYLON.Engine,
	scene: BABYLON.Scene,
	canvas: HTMLCanvasElement
};

export type SceneProps = {
	engineOptions?: BABYLON.EngineOptions,
	adaptToDeviceRatio?: boolean,
	onSceneMount?: (args: SceneEventArgs) => void,
	width?: number,
	height?: number
};

export default class Scene extends React.Component<SceneProps & React.HTMLAttributes<HTMLCanvasElement>, {}> {

	// @ts-ignore
	private scene: BABYLON.Scene;
	// @ts-ignore
	private engine: BABYLON.Engine;
	// @ts-ignore
	private canvas: HTMLCanvasElement;

	onResizeWindow = () => {
		if (this.engine) {
			this.engine.resize();
		}
	}

	componentDidMount () {
		this.engine = new BABYLON.Engine(
			this.canvas,
			true,
			this.props.engineOptions,
			this.props.adaptToDeviceRatio
		);

		let scene = new BABYLON.Scene(this.engine);
		this.scene = scene;

		if (typeof this.props.onSceneMount === 'function') {
			this.props.onSceneMount({
				scene,
				engine: this.engine,
				canvas: this.canvas
			});
		} else {
			console.error('onSceneMount function not available');
		}

		// Resize the babylon engine when the window is resized
		window.addEventListener('resize', this.onResizeWindow);
	}

	componentWillUnmount () {
		window.removeEventListener('resize', this.onResizeWindow);
	}

	onCanvasLoaded = (c) => {
		if (c !== null) {
			this.canvas = c;
		}
	}

	render () {
		// 'rest' can contain additional properties that you can flow through to canvas:
		// (id, className, etc.)
		let { width, height, ...rest } = this.props;

		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;
		const DEFAULT_HEIGHT = windowHeight * 4;
		const DEFAULT_WIDTH = windowWidth * 4;
		let opts: any = {width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT};

		if (width !== undefined && height !== undefined) {
			// opts.width = width;
			// opts.height = height;
		}

		return (
			<canvas
				{...opts}
				ref={this.onCanvasLoaded}
			/>
		)
	}
}
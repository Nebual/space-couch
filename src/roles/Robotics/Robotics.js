import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import gsap from 'gsap';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import './Robotics.scss';
import {
	useClientNet,
	useWebsocketMessage,
	useWebsocketStateChange,
} from '../../client/ClientNet';
import RobotActionsMenu from './RobotActionsMenu';
import StarCanvas from './StarCanvas';
import WiringLayer from './WiringLayer';

export const NODE_SIZE = 64;

export default function Robotics() {
	const clientNet = useClientNet();
	const shipRef = useRef();

	const [robots, setRobots] = useState([]);
	const [nodes, setNodes] = useState([]);
	const [subsystems, setSubsystems] = useState({});
	const subsystemsList = Object.values(subsystems);
	const [selectedRobot, setSelectedRobot] = useState(null);
	const [robotActionsOpen, setRobotActionsOpen] = useState(false);
	const [robotActionsPosition, setRobotActionsPosition] = useState({});
	const [shipId, setShipId] = useState('');
	const [showWires, setShowWires] = useState(false);

	const shipSize = shipRef.current?.getBoundingClientRect();

	const closeRobotActions = useCallback(() => {
		setRobotActionsOpen(false);
		setSelectedRobot(false);
	}, []);

	useWebsocketMessage(packet => {
		switch (packet.event) {
			case 'shipId':
				setShipId(packet.value);
				break;
			case 'robots':
				setRobots(
					packet.value.map(newRobot => ({
						...robots.find(id => id === newRobot.id),
						...newRobot,
					}))
				);
				break;
			case 'robotPath':
				setRobots(
					robots.map(robot =>
						robot.id === packet.id
							? {
									...robot,
									path: packet.value,
							  }
							: robot
					)
				);
				break;
			case 'nodeState':
				const nodeMatches = node =>
					node.left === packet.value.left &&
					node.top === packet.value.top &&
					node.type === packet.id;
				if (!packet.value.state) {
					setNodes(nodes.filter(node => !nodeMatches(node, packet)));
				} else if (!nodes.find(nodeMatches)) {
					setNodes([
						...nodes,
						{
							top: packet.value.top,
							left: packet.value.left,
							type: packet.id,
						},
					]);
				}
				break;
			case 'subsystemState':
				setSubsystems({
					...subsystems,
					[packet.id]: {
						...(subsystems[packet.id] || {}),
						...packet.value,
					},
				});
				break;
			default:
		}
	});

	return (
		<div className="container-robotics">
			<RobotActionsMenu
				robotActionsOpen={robotActionsOpen}
				closeRobotActions={closeRobotActions}
				robotActionsPosition={robotActionsPosition}
				robot={robots.find(robot => robot.id === selectedRobot) || {}}
				subsystemsList={subsystemsList}
			/>
			<div
				className="ship"
				onClick={e => {
					if (selectedRobot === null) {
						return;
					}
					if (robotActionsOpen) {
						return;
					}
					clientNet.send({
						event: 'moveRobot',
						id: selectedRobot,
						value: [
							Math.floor(e.nativeEvent.offsetX / NODE_SIZE),
							Math.floor(e.nativeEvent.offsetY / NODE_SIZE),
						],
					});

					setSelectedRobot(null);
				}}
			>
				<img
					src={shipId ? `/images/ships/${shipId}.png` : ''}
					ref={shipRef}
					alt="Ship Frame"
					className="ship-image"
				/>
				<StarCanvas />
				{subsystemsList.map(subsystem => (
					<div
						key={subsystem.id}
						className={classNames(
							'ship-subsystem',
							subsystem.className
						)}
						style={{
							backgroundImage: `url(${subsystem.image})`,
							left: subsystem.position.x * NODE_SIZE,
							top: subsystem.position.y * NODE_SIZE,
						}}
					/>
				))}
				{showWires && (
					<WiringLayer
						subsystems={subsystems}
						width={shipSize?.width}
						height={shipSize?.height}
					/>
				)}
				{nodes.map(node => {
					const styles = {
						left: node.left * NODE_SIZE,
						top: node.top * NODE_SIZE,
					};
					return <div className={node.type} style={styles} />;
				})}
				{robots.map(robot => (
					<Robot
						key={robot.id}
						onClick={e => {
							if (selectedRobot === robot.id) {
								setRobotActionsPosition({
									left: e.nativeEvent.layerX - 24,
									top: e.nativeEvent.layerY - 24,
								});
								setRobotActionsOpen(true);
							} else {
								setSelectedRobot(robot.id);
							}
							e.stopPropagation();
						}}
						isSelectedRobot={robot.id === selectedRobot}
						{...robot}
					/>
				))}
			</div>
			<FormControlLabel
				control={
					<Switch
						checked={showWires}
						onChange={() => setShowWires(!showWires)}
						value="1"
						color="primary"
					/>
				}
				label="Show Wires"
				labelPlacement="start"
				className="toggle-wiring-layer"
			/>
		</div>
	);
}

function Robot({
	id,
	top: serverTop,
	left: serverLeft,
	carrying,
	path,
	className,
	isSelectedRobot,
	...props
}) {
	const [top, setTop] = useState(serverTop);
	const [left, setLeft] = useState(serverLeft);
	const [busy, setBusy] = useState(false);

	const robotRef = useRef(null);
	const [animationTimeline] = useState(() => gsap.timeline());
	const syncId = 'robot_' + id;

	useWebsocketStateChange(
		useCallback(value => setBusy(value), []),
		syncId
	);

	useEffect(() => {
		setTop(serverTop);
		setLeft(serverLeft);
	}, [serverLeft, serverTop]);

	useEffect(() => {
		if (!path) {
			return;
		}
		let prevNode = path.shift(); // Pop off the current location
		for (let node of path) {
			let nodeDelta = [prevNode[0] - node[0], prevNode[1] - node[1]];
			let distance = Math.sqrt(
				Math.pow(nodeDelta[0], 2) + Math.pow(nodeDelta[1], 2)
			);
			animationTimeline.to(robotRef.current, {
				x: node[0] * NODE_SIZE,
				y: node[1] * NODE_SIZE,
				duration: 0.8 * distance,
				ease: 'linear',
				onStart: () => {
					robotRef.current.classList.remove(
						'pose-up',
						'pose-right',
						'pose-down',
						'pose-left'
					);
					robotRef.current.classList.add(
						nodeDelta[1] < 0
							? 'pose-down'
							: nodeDelta[1] > 0
							? 'pose-up'
							: nodeDelta[0] > 0
							? 'pose-left'
							: 'pose-right'
					);
				},
			});
			prevNode = node;
		}
	}, [id, path, animationTimeline]);

	return (
		<div
			ref={robotRef}
			className={classNames('robot', className)}
			style={{
				transform: `translate(${left * NODE_SIZE}px, ${top *
					NODE_SIZE}px)`,
			}}
			{...props}
		>
			{isSelectedRobot && <i className="fa fa-circle-o-notch fa-spin" />}
			{busy && <i className="fa fa-cog fa-spin robot__busy" />}
			{carrying && <i className="fa fa-plus robot__carrying" />}
		</div>
	);
}

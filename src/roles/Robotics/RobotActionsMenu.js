import React from 'react';
import classNames from 'classnames';

import { useClientNet } from '../../client/ClientNet';
import { NODE_SIZE } from './Robotics';

export default function RobotActionsMenu({
	robotActionsOpen,
	closeRobotActions,
	robotActionsPosition,
	robot,
	subsystemsList,
}) {
	const actionX = Math.round(robotActionsPosition.left / NODE_SIZE);
	const actionY = Math.round(robotActionsPosition.top / NODE_SIZE);
	const subsystem = subsystemsList.find(
		({ position: { x, y } }) => x === actionX && y === actionY
	);
	const connectIcon = (() => {
		if (robot.connecting && robot.connecting === subsystem?.id) {
			return 'fa-trash';
		}
		if (robot.connecting) {
			return subsystem ? 'fa-venus' : 'fa-close';
		}
		return 'fa-mars';
	})();
	return (
		<>
			<div
				className={classNames(
					'radial-overlay',
					robotActionsOpen && 'active'
				)}
				onClick={closeRobotActions}
			/>
			<ul
				id="robot-actions"
				className={classNames(
					'radial-menu',
					robotActionsOpen && 'active'
				)}
				style={robotActionsPosition}
				onClick={closeRobotActions}
			>
				<RobotAction selectedRobot={robot.id} syncId="extinguish">
					<i className="fa fa-3x fa-fire-extinguisher" />
				</RobotAction>
				<RobotAction selectedRobot={robot.id} syncId="repair">
					<img
						src="/images/tape.png"
						alt="tape"
						width="48"
						height="48"
					/>
				</RobotAction>
				<RobotAction selectedRobot={robot.id} syncId="replace">
					<i className="fa fa-3x fa-cogs" />
				</RobotAction>
				<RobotAction selectedRobot={robot.id} syncId="improve">
					<i className="fa fa-3x fa-wrench" />
				</RobotAction>
				<RobotAction
					selectedRobot={robot.id}
					disabled={!(subsystem || robot.connecting)}
					syncId="connect"
					className="connect"
				>
					<i className={classNames('fa fa-3x', connectIcon)} />
				</RobotAction>
				{!robot.carrying ? (
					<RobotAction
						selectedRobot={robot.id}
						disabled={!subsystem}
						syncId="pickup"
						className="install"
					>
						<i className="fa fa-3x fa-upload" />
					</RobotAction>
				) : (
					<RobotAction
						selectedRobot={robot.id}
						disabled={!!subsystem}
						syncId="install"
						className="install"
					>
						<i className="fa fa-3x fa-download" />
					</RobotAction>
				)}
			</ul>
		</>
	);
}

function RobotAction({ syncId, selectedRobot, children, disabled, className }) {
	const clientNet = useClientNet();
	return (
		<li
			onClick={() => {
				if (!syncId || disabled) {
					return;
				}
				clientNet.send({
					event: 'robotAction',
					id: selectedRobot,
					value: syncId,
				});
			}}
			className={classNames({ disabled }, className)}
		>
			{children}
		</li>
	);
}

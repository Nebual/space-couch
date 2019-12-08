import React from 'react';
import classNames from 'classnames';

import { useClientNet } from '../../client/ClientNet';

export default function RobotActionsMenu({
	robotActionsOpen,
	closeRobotActions,
	robotActionsPosition,
	selectedRobot,
}) {
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
				<RobotAction selectedRobot={selectedRobot} syncId="extinguish">
					<i className="fa fa-3x fa-fire-extinguisher" />
				</RobotAction>
				<RobotAction selectedRobot={selectedRobot} syncId="repair">
					<img
						src="/images/tape.png"
						alt="tape"
						width="48"
						height="48"
					/>
				</RobotAction>
				<RobotAction selectedRobot={selectedRobot} syncId="replace">
					<i className="fa fa-3x fa-cogs" />
				</RobotAction>
				<RobotAction selectedRobot={selectedRobot} syncId="improve">
					<i className="fa fa-3x fa-wrench" />
				</RobotAction>
				<RobotAction selectedRobot={selectedRobot}>
					<i className="fa fa-3x fa-asl-interpreting" />
				</RobotAction>
				<RobotAction selectedRobot={selectedRobot}>
					<i className="fa fa-3x fa-wheelchair-alt" />
				</RobotAction>
			</ul>
		</>
	);
}

function RobotAction({ syncId, selectedRobot, children }) {
	const clientNet = useClientNet();
	return (
		<li
			onClick={() => {
				if (!syncId) {
					return;
				}
				clientNet.send({
					event: 'robotAction',
					id: selectedRobot,
					value: syncId,
				});
			}}
		>
			{children}
		</li>
	);
}

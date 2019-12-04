import React from 'react';

import './Weapons.scss';

export default function() {
	return (
		<div className="container-weapons">
			<div className="weapons">
				<div id="weaponsCanvas" />
				<div
					id="gamma"
					style={{
						width: '100px',
						color: 'white',
						position: 'fixed',
						top: '0px',
						right: '25px',
					}}
				>
					CG:
				</div>
				<div
					id="alpha"
					style={{
						width: '100px',
						color: 'white',
						position: 'fixed',
						top: '20px',
						right: '25px',
					}}
				>
					CA:
				</div>
			</div>
		</div>
	);
}

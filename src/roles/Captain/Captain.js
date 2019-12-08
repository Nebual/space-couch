import React from 'react';

import './Captain.scss';
import ButtonSync from '../Engineer/ButtonSync';

export default function Captain() {
	return (
		<div className="container-captain">
			<h2 className="text-xs-center">Captain Stuff</h2>

			<ButtonSync className="btn btn-warning" toggle syncId="pause">
				<i className="fa fa-pause fa-4x" />
			</ButtonSync>
		</div>
	);
}

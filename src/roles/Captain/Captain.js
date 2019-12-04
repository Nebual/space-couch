import React from 'react';

import './Captain.scss';

export default function() {
	return (
		<div className="container-captain">
			<h2 className="text-xs-center">Captain Stuff</h2>

			<button
				id="pause-button"
				type="button"
				className="btn btn-warning"
				data-toggle="button"
				data-sync="pause"
			>
				<i className="fa fa-pause fa-4x" />
			</button>
		</div>
	);
}

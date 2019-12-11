import React from 'react';

import './Captain.scss';
import ButtonSync from '../Engineer/ButtonSync';
import Typography from '@material-ui/core/Typography';

export default function Captain() {
	return (
		<div className="container-captain">
			<Typography variant="h3" className="text-center">
				Captain Stuff
			</Typography>

			<ButtonSync className="btn btn-warning" toggle syncId="pause">
				<i className="fa fa-pause fa-4x" />
			</ButtonSync>
		</div>
	);
}

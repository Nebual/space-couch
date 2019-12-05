import React, { useState } from 'react';
import classNames from 'classnames';
import Button from '@material-ui/core/Button';

import './Button.scss';

export default function ButtonSync({ toggle, syncId, className, ...props }) {
	const [active, setActive] = useState(false);
	return (
		<Button
			onClick={() => {
				if (toggle) {
					setActive(!active);
				}
			}}
			className={classNames(className, active && ' active')}
			{...props}
		></Button>
	);
}

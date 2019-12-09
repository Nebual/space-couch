import React, { useState } from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';

import './Button.scss';
import { useClientNet, useWebsocketStateChange } from '../../client/ClientNet';

ButtonSync.propTypes = {
	toggle: PropTypes.bool,
	syncId: PropTypes.string,
	initialValue: PropTypes.bool,
	className: PropTypes.string,
};

export default function ButtonSync({
	toggle = false,
	syncId,
	initialValue = false,
	className,
	...props
}) {
	const clientNet = useClientNet();
	const [active, setActive] = useState(initialValue);
	useWebsocketStateChange(newValue => {
		setActive(newValue);
	}, syncId);
	return (
		<Button
			onClick={() => {
				if (toggle) {
					setActive(!active);
				}
				syncId && clientNet.sendState(syncId, !active);
			}}
			className={classNames(className, toggle && active && 'active')}
			{...props}
		/>
	);
}

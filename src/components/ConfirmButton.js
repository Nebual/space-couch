import React from 'react';
import classNames from 'classnames';
import CircularProgress from '@material-ui/core/CircularProgress';
import Fab from '@material-ui/core/Fab';
import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';

const useStyles = makeStyles(theme => ({
	root: {
		display: 'flex',
		alignItems: 'center',
	},
	wrapper: {
		margin: theme.spacing(1),
		position: 'relative',
	},
	fabProgress: {
		color: '#35a81d',
		position: 'absolute',
		top: -6,
		left: -6,
		zIndex: 1,
		pointerEvents: 'none',
	},
}));

export default function CircularIntegration({
	targetTime = 500,
	callBack,
	children,
	className,
}) {
	const classes = useStyles();
	const [loading, setLoading] = React.useState(false);
	const [progress, setProgress] = React.useState(0);
	const [start, setStart] = React.useState(null);

	const handleMouseDown = () => {
		setProgress(0);
		setLoading(true);
		setStart(new Date());
	};

	const handleMouseUp = () => {
		const end = new Date();
		if (end - start >= targetTime) {
			callBack();
		}
		setProgress(0);
		setLoading(false);
	};

	React.useEffect(() => {
		function tick() {
			if (loading) {
				const timePassed = new Date() - start;
				const newProgress = Math.round((timePassed / targetTime) * 100);

				setProgress(() => (newProgress > 100 ? 100 : newProgress));
			}
		}

		const timer = setInterval(tick, 20);
		return () => {
			clearInterval(timer);
		};
	}, [loading]);

	return (
		<div className={classNames(classes.root, className)}>
			<div className={classes.wrapper}>
				<Fab
					aria-label="save"
					color="primary"
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onTouchStart={handleMouseDown}
					onTouchEnd={handleMouseUp}
				>
					{progress >= 100 ? <CheckIcon /> : children}
				</Fab>
				{loading && (
					<CircularProgress
						variant="determinate"
						size={68}
						className={classes.fabProgress}
						value={progress}
					/>
				)}
			</div>
		</div>
	);
}

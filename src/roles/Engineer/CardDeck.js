import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import classNames from 'classnames';

import './CardDeck.scss';

export default function CardDeck({
	cards,
	className,
	cardOverride,
	swipeable = true,
	...props
}) {
	const [currentCard, setCurrentCard] = useState(0);
	const swipeableHandlers = useSwipeable({
		onSwipedLeft: () =>
			setCurrentCard(Math.min(cards.length - 1, currentCard + 1)),
		onSwipedRight: () => setCurrentCard(Math.max(0, currentCard - 1)),
		preventDefaultTouchmoveEvent: true,
		trackMouse: true,
	});
	useEffect(() => {
		if (cardOverride === 0 || cardOverride > 0) {
			setCurrentCard(cardOverride);
		}
	}, [cardOverride]);

	return (
		<div
			className={classNames(className, 'CardDeck')}
			{...props}
			{...(swipeable ? swipeableHandlers : {})}
		>
			{cards.map((card, index) => (
				<div
					className={classNames(
						'card',
						index !== currentCard && 'hidden'
					)}
					key={index}
				>
					{card}
				</div>
			))}
		</div>
	);
}

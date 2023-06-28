import React from 'react';
import { Animated, View, Text } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import PropTypes from 'prop-types';

import I18n from '../../i18n';
import styles, { ACTION_WIDTH, LONG_SWIPE } from './styles';
import { CustomIcon } from '../../lib/Icons';
import { themes } from '../../constants/colors';

const reverse = new Animated.Value(I18n.isRTL ? -1 : 1);

export const LeftActions = React.memo(({
	theme, transX, notifications, width, onToggleNotifyPress
}) => {
	const translateX = Animated.multiply(
		transX.interpolate({
			inputRange: [0, ACTION_WIDTH],
			outputRange: [-ACTION_WIDTH, 0]
		}),
		reverse
	);
	return (
		<View
			style={styles.actionsContainer}
			pointerEvents='box-none'
		>
			<Animated.View
				style={[
					styles.actionLeftButtonContainer,
					{
						right: width - ACTION_WIDTH,
						width,
						transform: [{ translateX }],
						backgroundColor: themes[theme].tintColor
					}
				]}
			>
				<View style={styles.actionLeftButtonContainer}>
					<RectButton style={styles.actionButton} onPress={onToggleNotifyPress}>
						<>
							<CustomIcon size={20} name={notifications ? 'notification' : 'notification-disabled'} color='white' />
							<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t(`${notifications ? 'Disable' : 'Enable'}_notifications`)}</Text>
						</>
					</RectButton>
				</View>
			</Animated.View>
		</View>
	);
});

export const RightActions = React.memo(({
	transX, blocker, favorite, width, toggleFav, onToggleBlock, theme
}) => {
	const translateXFav = Animated.multiply(
		transX.interpolate({
			inputRange: [-width, -LONG_SWIPE, -ACTION_WIDTH, 0],
			outputRange: [0, width - LONG_SWIPE, width - ACTION_WIDTH, width]
		}),
		reverse
	);
	return (
		<View
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				height: 75,
				flexDirection: 'row'
			}}
			pointerEvents='box-none'
		>
			<Animated.View
				style={[
					styles.actionRightButtonContainer,
					{
						width,
						transform: [{ translateX: translateXFav }],
						backgroundColor: themes[theme].favoriteBackground
					}
				]}
			>
				<RectButton style={[styles.actionButton, { backgroundColor: themes[theme].favoriteBackground }]} onPress={toggleFav}>
					<>
						<CustomIcon size={20} name={favorite ? 'star-filled' : 'star'} color={themes[theme].buttonText} />
						<Text style={[styles.actionText, { color: themes[theme].buttonText }]}>{I18n.t(favorite ? 'Unfavorite' : 'Favorite')}</Text>
					</>
				</RectButton>
			</Animated.View>
		</View>
	);
});

LeftActions.propTypes = {
	theme: PropTypes.string,
	transX: PropTypes.object,
	isRead: PropTypes.bool,
	width: PropTypes.number,
	onToggleNotifyPress: PropTypes.func
};

RightActions.propTypes = {
	theme: PropTypes.string,
	transX: PropTypes.object,
	favorite: PropTypes.bool,
	blocker: PropTypes.bool,
	width: PropTypes.number,
	toggleFav: PropTypes.func,
	onToggleBlock: PropTypes.func
};

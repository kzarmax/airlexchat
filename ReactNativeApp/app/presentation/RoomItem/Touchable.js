import React from 'react';
import PropTypes from 'prop-types';
import { Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import Touch from '../../utils/touch';
import {
	ACTION_WIDTH,
	SMALL_SWIPE,
	LONG_SWIPE
} from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import { LeftActions, RightActions } from './Actions';

class Touchable extends React.Component {
	static propTypes = {
		blocker: PropTypes.bool,
		onPress: PropTypes.func,
		testID: PropTypes.string,
		width: PropTypes.number,
		favorite: PropTypes.bool,
		notifications: PropTypes.bool,
		rid: PropTypes.string,
		myCardId: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleNotify: PropTypes.func,
		toggleBlock: PropTypes.func,
		children: PropTypes.element,
		theme: PropTypes.string,
		isFocused: PropTypes.bool,
		swipeEnabled: PropTypes.bool
	}

	constructor(props) {
		super(props);
		this.dragX = new Animated.Value(0);
		this.rowOffSet = new Animated.Value(0);
		this.reverse = new Animated.Value(I18n.isRTL ? -1 : 1);
		this.transX = Animated.add(
			this.rowOffSet,
			this.dragX
		);
		this.transXReverse = Animated.multiply(
			this.transX,
			this.reverse
		);
		this.state = {
			rowState: 0 // 0: closed, 1: right opened, -1: left opened
		};
		this._onGestureEvent = Animated.event(
			[{ nativeEvent: { translationX: this.dragX } }], { useNativeDriver: true }
		);
		this._value = 0;
	}

		_onHandlerStateChange = ({ nativeEvent }) => {
			if (nativeEvent.oldState === State.ACTIVE) {
				this._handleRelease(nativeEvent);
			}
		}


		_handleRelease = (nativeEvent) => {
			const { translationX } = nativeEvent;
			const { rowState } = this.state;
			this._value += translationX;

			let toValue = 0;
			if (rowState === 0) { // if no option is opened
				if (translationX > 0 && translationX < LONG_SWIPE) {
					// open leading option if he swipe right but not enough to trigger action
					if (I18n.isRTL) {
						toValue = ACTION_WIDTH;
					} else {
						toValue = ACTION_WIDTH;
					}
					this.setState({ rowState: -1 });
				} else if (translationX >= LONG_SWIPE) {
					toValue = 0;
					if (I18n.isRTL) {
						//this.toggleBlock();
					} else {
						this.toggleNotify();
					}
				} else if (translationX < 0 && translationX > -LONG_SWIPE) {
					// open trailing option if he swipe left
					if (I18n.isRTL) {
						toValue = -ACTION_WIDTH;
					} else {
						toValue = -ACTION_WIDTH;
					}
					this.setState({ rowState: 1 });
				} else if (translationX <= -LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					if (I18n.isRTL) {
						this.toggleNotify();
					} else {
						//this.toggleBlock();
					}
				} else {
					toValue = 0;
				}
			}

			if (rowState === -1) { // if left option is opened
				if (this._value < SMALL_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
				} else if (this._value > LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					if (I18n.isRTL) {
						//this.toggleBlock();
					} else {
						this.toggleNotify();
					}
				} else if (I18n.isRTL) {
					toValue = ACTION_WIDTH;
				} else {
					toValue = ACTION_WIDTH;
				}
			}

			if (rowState === 1) { // if right option is opened
				if (this._value > SMALL_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
				} else if (this._value < -LONG_SWIPE) {
					toValue = 0;
					this.setState({ rowState: 0 });
					if (I18n.isRTL) {
						this.toggleNotify();
					} else {
						//this.toggleBlock();
					}
				} else if (I18n.isRTL) {
					toValue = -ACTION_WIDTH;
				} else {
					toValue = -ACTION_WIDTH;
				}
			}
			this._animateRow(toValue);
		}

		_animateRow = (toValue) => {
			this.rowOffSet.setValue(this._value);
			this._value = toValue;
			this.dragX.setValue(0);
			Animated.spring(this.rowOffSet, {
				toValue,
				bounciness: 0,
				useNativeDriver: true
			}).start();
		}

		close = () => {
			this.setState({ rowState: 0 });
			this._animateRow(0);
		}

		toggleFav = () => {
			const { toggleFav, rid, myCardId, favorite } = this.props;
			if (toggleFav) {
				toggleFav(rid, myCardId, favorite);
			}
			this.close();
		};

		toggleNotify = () => {
				const { toggleNotify, rid, myCardId, notifications } = this.props;
				if (toggleNotify) {
					const setting = {
						mobilePushNotifications: notifications ? 'nothing' : 'default'
					};
					toggleNotify(rid, myCardId, setting);
				}
		};

		toggleBlock = () => {
			const { toggleBlock, rid, myCardId, blocker } = this.props;
			if (toggleBlock) {
				toggleBlock(rid, myCardId, blocker);
			}
		};

		onToggleNotifyPress = () => {
			this.toggleNotify();
			this.close();
		};

		onToggleBlock = () => {
			this.toggleBlock();
			this.close();
		};

		onPress = () => {
			const { rowState } = this.state;
			if (rowState !== 0) {
				this.close();
				return;
			}
			const { onPress } = this.props;
			if (onPress) {
				onPress();
			}
		};

		render() {
			const {
				testID, blocker, notifications, width, favorite, children, theme, isFocused, swipeEnabled
			} = this.props;

			return (

				<PanGestureHandler
					minDeltaX={20}
					onGestureEvent={this._onGestureEvent}
					onHandlerStateChange={this._onHandlerStateChange}
					enabled={swipeEnabled}
				>
					<Animated.View>
						<LeftActions
							transX={this.transXReverse}
							notifications={notifications}
							width={width}
							onToggleNotifyPress={this.onToggleNotifyPress}
							theme={theme}
						/>
						<RightActions
							transX={this.transXReverse}
							favorite={favorite}
							blocker={blocker}
							width={width}
							toggleFav={this.toggleFav}
							onToggleBlock={this.onToggleBlock}
							theme={theme}
						/>
						<Animated.View
							style={{
								transform: [{ translateX: this.transX }]
							}}
						>
							<Touch
								onPress={this.onPress}
								theme={theme}
								testID={testID}
								style={{
									backgroundColor: isFocused ? themes[theme].chatComponentBackground : themes[theme].backgroundColor
								}}
							>
								{children}
							</Touch>
						</Animated.View>
					</Animated.View>

				</PanGestureHandler>
			);
		}
}

export default Touchable;

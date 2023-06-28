import React from 'react';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';
import {Animated, View} from "react-native";
import {PanGestureHandler, State} from "react-native-gesture-handler";
import {themes} from "../../constants/colors";
import {CustomIcon} from "../../lib/Icons";

const SWIPE_TP = 60;

class RCTouchable extends React.Component {
	static propTypes = {
		children: PropTypes.node,
		onPress: PropTypes.func,
		onLongPress: PropTypes.func,
		onReply: PropTypes.func,
		swipeEnabled: PropTypes.bool,
		disabled: PropTypes.bool,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.dragX = new Animated.Value(0);
		this.rowOffSet = new Animated.Value(0);
		this.transX = Animated.add(
			this.rowOffSet,
			this.dragX
		);
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
		const {translationX} = nativeEvent;
		this._value += translationX;
		if(this._value > SWIPE_TP){
			const { onReply } = this.props;//
			if(onReply) onReply();
		}

		let toValue = 0;
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

	render() {
		const { children, disabled, onPress, onLongPress, textColor, swipeEnabled, theme } = this.props;
		const ICON_SIZE = 32;
		return (
			<PanGestureHandler
				minDeltaX={20}
				onGestureEvent={this._onGestureEvent}
				onHandlerStateChange={this._onHandlerStateChange}
				enabled={swipeEnabled}
			>
				<Animated.View
					style={{
						transform: [{ translateX: this.transX }]
					}}
				>
					<View
						style={{
							position: 'absolute',
							alignItems: 'center',
							left: -ICON_SIZE,
							height: '100%',
							flexDirection: 'row'
						}}
						pointerEvents='box-none'
					>
						<CustomIcon size={ICON_SIZE} name={'threads'} color={textColor?textColor:themes[theme].auxiliaryText} />
					</View>
					<Touchable
						onLongPress={onLongPress}
						onPress={onPress}
						disabled={disabled}
						theme={theme}
					>
						{children}
					</Touchable>
				</Animated.View>
			</PanGestureHandler>
		);
	}

}

export default RCTouchable;

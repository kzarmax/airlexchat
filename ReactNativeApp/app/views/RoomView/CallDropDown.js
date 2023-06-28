import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';

import Touch from '../../utils/touch';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import {COLOR_SEPARATOR, themes} from '../../constants/colors';

const ANIMATION_DURATION = 200;

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFill
	},
	dropdownContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '100%',
		position: 'absolute',
		top: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		zIndex: 10
	},
	dropdownContainerHeader: {
		paddingVertical: 8,
		paddingHorizontal: 24,
		height: 72,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column'
	},
	sortToggleContainerClose: {
		position: 'absolute',
		top: 0,
		width: '100%'
	},
	sortToggleText: {
		color: '#9EA2A8',
		fontSize: 15,
		fontWeight: 'normal'
	}
});

class CallDropDown extends PureComponent {
	static propTypes = {
		close: PropTypes.func,
		theme: PropTypes.string,
		callJitsi: PropTypes.func,
	}

	constructor(props) {
		super(props);
		this.animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		Animated.timing(
			this.animatedValue,
			{
				toValue: 1,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start();
	}

	callJitsi = (onlyAudio) => {
		const { callJitsi } = this.props;
		callJitsi(onlyAudio);
		this.close();
	};


	close = () => {
		const { close } = this.props;
		Animated.timing(
			this.animatedValue,
			{
				toValue: 0,
				duration: ANIMATION_DURATION,
				easing: Easing.inOut(Easing.quad),
				useNativeDriver: true
			}
		).start(() => close());
	}

	render() {
		const translateY = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [-326, 0]
		});
		const backdropOpacity = this.animatedValue.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 0.3]
		});
		const {
			theme
		} = this.props;

		return (
			<>
				<TouchableWithoutFeedback onPress={this.close}>
					<Animated.View style={[styles.backdrop, { backgroundColor: themes[theme].backdropColor, opacity: backdropOpacity }]} />
				</TouchableWithoutFeedback>
				<Animated.View
					style={[
						styles.dropdownContainer,
						{
							transform: [{ translateY }],
							backgroundColor: themes[theme].bannerBackground,
							borderColor: themes[theme].separatorColor
						}
					]}
				>
					<Touch
						onPress={() => this.callJitsi(true)}
						theme={theme}
					>
						<View style={styles.dropdownContainerHeader}>
							<CustomIcon name={'phone'} size={32} color={themes[theme].bodyText}/>
							<Text style={[styles.sortToggleText, { color: themes[theme].bodyText }]}>{I18n.t(`Voice_calling`)}</Text>
						</View>
					</Touch>
					<Touch
						onPress={() => this.callJitsi(false)}
						theme={theme}
					>
						<View style={styles.dropdownContainerHeader}>
							<CustomIcon name={'camera'} size={32} color={themes[theme].bodyText}/>
							<Text style={[styles.sortToggleText, { color: themes[theme].bodyText }]}>{I18n.t(`Video_calling`)}</Text>
						</View>
					</Touch>
				</Animated.View>
			</>
		);
	}
}

export default CallDropDown;

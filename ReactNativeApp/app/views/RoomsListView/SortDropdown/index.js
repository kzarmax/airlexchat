import React, { PureComponent } from 'react';
import {
	View, Text, Animated, Easing, TouchableWithoutFeedback
} from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import Touch from '../../../utils/touch';
import I18n from '../../../i18n';
import { CustomIcon } from '../../../lib/Icons';
import { withTheme } from '../../../theme';
import { themes } from '../../../constants/colors';
import { SortItemButton, SortItemContent } from './Item';

const ANIMATION_DURATION = 200;

class Sort extends PureComponent {
	static propTypes = {
		onlyBlocks: PropTypes.bool,
		close: PropTypes.func,
		theme: PropTypes.string,
		showOnlyBlocks: PropTypes.func,
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

	showOnlyBlocks = (block) => {
		return () => {
			const { showOnlyBlocks } = this.props;
			showOnlyBlocks(block);
		}
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
			onlyBlocks, theme
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
						onPress={this.close}
						theme={theme}
					>
						<View style={[styles.dropdownContainerHeader, { borderColor: themes[theme].separatorColor }]}>
							<View style={styles.sortItemContainer}>
								<Text style={[styles.sortToggleText, { color: themes[theme].auxiliaryText }]}>{I18n.t(`Show_${!onlyBlocks?'All_Rooms':'Only_Block_Rooms'}`)}</Text>
							</View>
						</View>
					</Touch>
					<SortItemButton onPress={this.showOnlyBlocks(false)} theme={theme}>
						<SortItemContent
							icon='message'
							label='Show_All_Rooms'
							checked={!onlyBlocks}
							theme={theme}
						/>
					</SortItemButton>
					<SortItemButton onPress={this.showOnlyBlocks(true)} theme={theme}>
						<SortItemContent
							icon='ignore'
							label='Show_Only_Block_Rooms'
							checked={onlyBlocks}
							theme={theme}
						/>
					</SortItemButton>
				</Animated.View>
			</>
		);
	}
}

export default withTheme(Sort);

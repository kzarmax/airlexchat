import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import PropTypes from 'prop-types';
import { BorderlessButton } from 'react-native-gesture-handler';

import sharedStyles from '../views/Styles';
import TextInput from '../presentation/TextInput';
import { COLOR_DANGER, COLOR_TEXT, themes } from '../constants/colors';
import { CustomIcon } from '../lib/Icons';
import ActivityIndicator from './ActivityIndicator';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {ViewPropTypes} from "../utils/propTypes";

const styles = StyleSheet.create({
	error: {
		...sharedStyles.textAlignCenter,
		paddingTop: 5
	},
	inputContainer: {
		marginBottom: 10
	},
	label: {
		marginBottom: 10,
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	required: {
		marginBottom: 10,
		color: COLOR_DANGER,
		fontSize: 14,
		fontWeight: '700'
	},
	input: {
		...sharedStyles.textRegular,
		height: 48,
		fontSize: 16,
		paddingHorizontal: 14,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 10
	},
	inputIconLeft: {
		paddingLeft: 45
	},
	inputIconRight: {
		paddingRight: 45
	},
	wrap: {
		position: 'relative'
	},
	iconContainer: {
		position: 'absolute',
		top: 14
	},
	iconLeft: {
		left: 15
	},
	iconRight: {
		right: 15
	},
	icon: {
		color: '#2F343D'
	},
});


export default class RCTextInput extends React.PureComponent {
	static propTypes = {
		label: PropTypes.string,
		required: PropTypes.string,
		error: PropTypes.object,
		loading: PropTypes.bool,
		secureTextEntry: PropTypes.bool,
		containerStyle: ViewPropTypes.style,
		inputStyle: PropTypes.object,
		inputRef: PropTypes.func,
		testID: PropTypes.string,
		iconLeft: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
		iconRight: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
		placeholder: PropTypes.string,
		left: PropTypes.element,
		onIconRightPress: PropTypes.func,
		theme: PropTypes.string
	}

	static defaultProps = {
		error: {},
		theme: 'light'
	}

	state = {
		showPassword: false
	}

	get iconLeft() {
		const { testID, iconLeft, theme } = this.props;
		if(iconLeft.vector){
			return (
				<MaterialCommunityIcons
					name={iconLeft.icon}
					testID={testID ? `${ testID }-icon-left` : null}
					style={[styles.iconContainer, styles.iconLeft, { color: themes[theme].bodyText }]}
					size={18}
				/>
			)
		}
		return (
			<CustomIcon
				name={iconLeft}
				testID={testID ? `${ testID }-icon-left` : null}
				style={[styles.iconContainer, styles.iconLeft, { color: themes[theme].bodyText }]}
				size={20}
			/>
		);
	}

	get iconRight() {
		const { iconRight, onIconRightPress, theme } = this.props;
		if(iconRight.vector){
			return (
				<MaterialCommunityIcons
					name={iconRight.icon}
					style={{ color: themes[theme].bodyText }}
					size={18}
				/>
			);
		}
		return (
			<BorderlessButton onPress={onIconRightPress} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon
					name={iconRight}
					style={{ color: themes[theme].bodyText }}
					size={20}
				/>
			</BorderlessButton>
		);
	}

	get iconPassword() {
		const { showPassword } = this.state;
		const { testID, theme } = this.props;
		return (
			<BorderlessButton onPress={this.tooglePassword} style={[styles.iconContainer, styles.iconRight]}>
				<CustomIcon
					name={showPassword ? 'unread-on-top' : 'unread-on-top-disabled'}
					testID={testID ? `${ testID }-icon-right` : null}
					style={{ color: themes[theme].auxiliaryText }}
					size={20}
				/>
			</BorderlessButton>
		);
	}

	get loading() {
		const { theme } = this.props;
		return <ActivityIndicator style={[styles.iconContainer, styles.iconRight, { color: themes[theme].bodyText }]} />;
	}

	tooglePassword = () => {
		this.setState(prevState => ({ showPassword: !prevState.showPassword }));
	}

	render() {
		const { showPassword } = this.state;
		const {
			label, left, required, error, loading, secureTextEntry, containerStyle, inputRef, iconLeft, iconRight, inputStyle, testID, placeholder, theme, ...inputProps
		} = this.props;
		const { dangerColor } = themes[theme];
		return (
			<View style={[styles.inputContainer, containerStyle]}>
				{label ? (
					<Text
						contentDescription={null}
						accessibilityLabel={null}
						style={[
							styles.label,
							{ color: themes[theme].titleText },
							error.error && { color: dangerColor }
						]}
					>
						{label}
						{required ? <Text contentDescription={null} accessibilityLabel={null} style={[styles.required, error.error && styles.labelError]}>{` ${ required }`}</Text> : null}
					</Text>
				) : null}
				<View style={styles.wrap}>
					<TextInput
						style={[
							styles.input,
							iconLeft && styles.inputIconLeft,
							(secureTextEntry || iconRight) && styles.inputIconRight,
							{
								backgroundColor: themes[theme].backgroundColor,
								borderColor: themes[theme].separatorColor,
								color: themes[theme].titleText
							},
							error.error && {
								color: dangerColor,
								borderColor: dangerColor
							},
							inputStyle
						]}
						ref={inputRef}
						autoCorrect={false}
						autoCapitalize='none'
						underlineColorAndroid='transparent'
						secureTextEntry={secureTextEntry && !showPassword}
						testID={testID}
						accessibilityLabel={placeholder}
						placeholder={placeholder}
						contentDescription={placeholder}
						theme={theme}
						{...inputProps}
					/>
					{iconLeft ? this.iconLeft : null}
					{iconRight ? this.iconRight : null}
					{secureTextEntry ? this.iconPassword : null}
					{loading ? this.loading : null}
					{left}
				</View>
				{error && error.reason ? <Text style={[styles.error, { color: dangerColor }]}>{error.reason}</Text> : null}
			</View>
		);
	}
}

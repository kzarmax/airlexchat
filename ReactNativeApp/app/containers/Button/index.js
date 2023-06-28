import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';

import {
	COLOR_BUTTON_PRIMARY,
	COLOR_BUTTON_SECONDARY,
	COLOR_BUTTON_DEFAULT,
	COLOR_BUTTON_DANGER,
	COLOR_BUTTON_WHITE,
	COLOR_BUTTON_GRAY,
	COLOR_BUTTON_DONE,
	COLOR_BUTTON_FACEBOOK,
	COLOR_BUTTON_GOOGLE,
	COLOR_BUTTON_TEXT_PRIMARY,
	COLOR_BUTTON_TEXT_SECONDARY,
	COLOR_BUTTON_TEXT_DEFAULT,
	COLOR_BUTTON_TEXT_DANGER,
	COLOR_BUTTON_TEXT_WHITE,
	COLOR_BUTTON_TEXT_DONE,
	COLOR_BUTTON_TEXT_FACEBOOK,
	COLOR_BUTTON_TEXT_GOOGLE,
	themes,
	COLOR_BUTTON_APPLE_LIGHT,
	COLOR_BUTTON_APPLE_DARK,
	COLOR_BUTTON_APPLE_BLACK,
	COLOR_BUTTON_TEXT_APPLE_LIGHT,
	COLOR_BUTTON_TEXT_APPLE_DARK,
	COLOR_BUTTON_TEXT_APPLE_BLACK
} from '../../constants/colors';
import sharedStyles from '../../views/Styles';

/* eslint-disable react-native/no-unused-styles */
const styles = StyleSheet.create({
	container: {
		borderRadius: 6,
		marginBottom: 10
	},
	oauthButtonContainer: {
		borderRadius: 10,
		width: '100%',
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16
	},
	buttonContainer: {
		borderRadius: 10,
		width: '100%',
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 16
	},
	oauthIcon: {
		width: 19,
		height: 19,
		marginRight: 4,
		resizeMode: 'contain'
	},
	icon: {
		position: 'absolute',
		left: 7.5,
		top: 7.5,
		width: 35,
		height: 35,
		resizeMode: 'contain'
	},
	text: {
		...sharedStyles.textMedium,
		fontSize: 16,
		letterSpacing: 1.6,
		textAlign: 'center'
	},
	oauthText: {
		...sharedStyles.textMedium,
		marginLeft: 11,
		marginRight: 19,
		fontSize: 19,
	},
	shadow: {
		shadowColor: '#000',
		shadowRadius: 2,
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 2
		},
		elevation: 8
	},
	background_primary: {
		backgroundColor: COLOR_BUTTON_PRIMARY
	},
	background_secondary: {
		backgroundColor: COLOR_BUTTON_SECONDARY
	},
	background_default: {
		backgroundColor: COLOR_BUTTON_DEFAULT
	},
	background_danger: {
		backgroundColor: COLOR_BUTTON_DANGER
	},
	background_white: {
		backgroundColor: COLOR_BUTTON_WHITE,
		borderWidth: 1,
		borderColor: '#EBEBEB'
	},
	background_grey: {
		backgroundColor: COLOR_BUTTON_GRAY,
		borderWidth: 1,
		borderColor: '#EBEBEB'
	},
	background_done: {
		backgroundColor: COLOR_BUTTON_DONE
	},
	background_facebook: {
		backgroundColor: COLOR_BUTTON_FACEBOOK
	},
	background_google: {
		backgroundColor: COLOR_BUTTON_GOOGLE
	},
	background_apple_light: {
		backgroundColor: COLOR_BUTTON_APPLE_LIGHT
	},
	background_apple_dark: {
		backgroundColor: COLOR_BUTTON_APPLE_DARK
	},
	background_apple_black: {
		backgroundColor: COLOR_BUTTON_APPLE_BLACK
	},
	text_color_primary: {
		color: COLOR_BUTTON_TEXT_PRIMARY
	},
	text_color_secondary: {
		color: COLOR_BUTTON_TEXT_SECONDARY
	},
	text_color_default: {
		color: COLOR_BUTTON_TEXT_DEFAULT
	},
	text_color_danger: {
		color: COLOR_BUTTON_TEXT_DANGER
	},
	text_color_white: {
		color: COLOR_BUTTON_TEXT_WHITE
	},
	text_color_done: {
		color: COLOR_BUTTON_TEXT_DONE
	},
	text_color_facebook: {
		color: COLOR_BUTTON_TEXT_FACEBOOK
	},
	text_color_google: {
		color: COLOR_BUTTON_TEXT_GOOGLE
	},
	text_color_apple_light: {
		color: COLOR_BUTTON_TEXT_APPLE_LIGHT
	},
	text_color_apple_dark: {
		color: COLOR_BUTTON_TEXT_APPLE_DARK
	},
	text_color_apple_black: {
		color: COLOR_BUTTON_TEXT_APPLE_BLACK
	},

	button_size_Z: {
		width: 335
	},
	button_size_Y: {
		width: 201
	},
	button_size_X: {
		width: 125
	},
	button_size_W: {
		width: 313
	},
	button_size_V: {
		width: 125
	},
	button_size_U: {
		width: 140
	},
	button_size_T: {
		width: 313
	},
	button_size_S: {
		width: 345
	},

	font_weight_regular: {
		...sharedStyles.textRegular
	},
	font_weight_medium: {
		...sharedStyles.textMedium
	},
	font_weight_semibold: {
		...sharedStyles.textSemibold
	},
	font_weight_bold: {
		...sharedStyles.textBold
	}
});

export default class Button extends React.PureComponent {
	static propTypes = {
		title: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
		text: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
		icon: PropTypes.string,
		type: PropTypes.string,
		oauth: PropTypes.bool,
		size: PropTypes.string,
		onPress: PropTypes.func,
		hidden: PropTypes.bool,
		disabled: PropTypes.bool,
		width: PropTypes.string,
		height: PropTypes.string,
		backgroundColor: PropTypes.string,
		loading: PropTypes.bool,
		style: PropTypes.any,
		textColor: PropTypes.string,
		fontWeight: PropTypes.string,
		theme: PropTypes.string,
	}

	static defaultProps = {
		title: 'Press me!',
		type: 'primary',
		size: 'Z',
		onPress: () => alert('It works!'),
		oauth: false,
		icon: null,
		hidden: false,
		disabled: false,
		loading: false
	}

	render() {
		const {
			title, text, icon, type, oauth, size, onPress,
			hidden, disabled, width, height, backgroundColor,
			loading, style, textColor : color, fontWeight, theme,
			...otherProps
		} = this.props;

		if (hidden) {
			return null;
		}

		let customColor = null;
		let backgroundStyle = {};
		if(type === 'apple'){
			backgroundStyle = styles[`background_${ type }_${theme}`];
			customColor = styles[`text_color_${type}_${theme}`];
		} else {
			backgroundStyle = backgroundColor ? { backgroundColor } : styles[`background_${ type }`];
		}

		return (
			<RectButton
				onPress={onPress}
				enabled={!(disabled || loading)}
				style={[
					styles.container,
					styles.shadow,
					backgroundStyle,
					size ? styles[`button_size_${ size }`] : {},
					disabled && { backgroundColor: themes[theme].inactiveTintColor},
					style
				]}
				{...otherProps}
			>
				<View style={[
					oauth?styles.oauthButtonContainer:styles.buttonContainer,
					// styles.shadow,
					size ? styles[`button_size_${ size }`] : {},
					width ? { width } : {},
					height ? { height } : {}
				]}
				>
					{
						icon ? <FontAwesomeIcon name={icon} size={24} style={{ marginRight: 8, ...(customColor?customColor:{ color: color??themes[theme].buttonText })}}/> : null
					}
					{
						loading
							? <ActivityIndicator color={color??themes[theme].buttonText}/>
							: <Text style={{ ...(oauth?styles.oauthText:styles.text), ...(customColor?customColor:{color: color??themes[theme].buttonText}) , fontWeight: (fontWeight ? styles[`font_weight_${ fontWeight }`] : 'normal')}}>{ text || title }</Text>
					}
				</View>
			</RectButton>
		);
	}
}

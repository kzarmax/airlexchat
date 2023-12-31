import { StyleSheet, Platform } from 'react-native';

import { MAX_SCREEN_CONTENT_WIDTH } from '../constants/tablet';
import { moderateScale } from '../utils/scaling';
import {
	COLOR_DANGER
} from '../constants/colors';
import { isIOS } from '../utils/deviceInfo';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	containerScrollView: {
		padding: 15
	},
	label: {
		lineHeight: 40,
		height: 40,
		fontSize: 16,
		marginBottom: 5,
		color: 'white'
	},
	label_white: {
		lineHeight: 40,
		height: 40,
		fontSize: 16,
		marginBottom: 5,
		color: '#2f343d'
	},
	label_error: {
		color: COLOR_DANGER,
		flexGrow: 1,
		paddingHorizontal: 0,
		marginBottom: 20
	},
	buttonContainerLastChild: {
		marginBottom: 40
	},
	buttonContainer: {
		paddingVertical: 15,
		backgroundColor: '#414852',
		marginBottom: 20,
		borderRadius: 2
	},
	buttonContainer_white: {
		paddingVertical: 15,
		backgroundColor: '#1d74f5',
		marginBottom: 20
	},
	buttonContainer_inverted: {
		paddingVertical: 15,
		marginBottom: 0
	},
	button: {
		textAlign: 'center',
		color: 'white',
		fontWeight: '700'
	},
	button_white: {
		textAlign: 'center',
		color: 'white',
		fontWeight: '700'
	},
	button_inverted: {
		textAlign: 'center',
		color: '#414852',
		fontWeight: '700',
		flexGrow: 1
	},
	error: {
		textAlign: 'center',
		color: COLOR_DANGER,
		paddingTop: 5
	},
	loading: {
		flex: 1,
		position: 'absolute',
		backgroundColor: 'rgba(255,255,255,.2)',
		left: 0,
		top: 0
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		paddingHorizontal: 0,
		paddingBottom: 5
	},
	switchLabel: {
		fontSize: 16,
		color: '#2f343d',
		paddingHorizontal: 10
	},
	switchDescription: {
		fontSize: 16,
		color: '#9ea2a8'
	},
	disabledButton: {
		backgroundColor: '#e1e5e8'
	},
	enabledButton: {
		backgroundColor: '#1d74f5'
	},
	link: {
		fontWeight: 'bold',
		textDecorationLine: 'underline'
	},
	loginTermsText: {
		marginBottom: 20,
		color: '#414852',
		fontSize: 13,
		fontWeight: '700'
	},
	validText: {
		color: 'green'
	},
	invalidText: {
		color: COLOR_DANGER
	},
	validatingText: {
		color: '#aaa'
	},
	oauthButton: {
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		margin: 4,
		borderRadius: 2
	},
	facebookButton: {
		backgroundColor: '#3b5998'
	},
	githubButton: {
		backgroundColor: '#4c4c4c'
	},
	gitlabButton: {
		backgroundColor: '#373d47'
	},
	googleButton: {
		backgroundColor: '#dd4b39'
	},
	linkedinButton: {
		backgroundColor: '#1b86bc'
	},
	meteorButton: {
		backgroundColor: '#de4f4f'
	},
	twitterButton: {
		backgroundColor: '#02acec'
	},
	closeOAuth: {
		position: 'absolute',
		left: 5,
		top: isIOS ? 20 : 0,
		backgroundColor: 'transparent'
	},
	oAuthModal: {
		margin: 0
	},
	tabletScreenContent: {
		justifyContent: 'center',
		alignSelf: 'center',
		width: MAX_SCREEN_CONTENT_WIDTH
	},
	modalFormSheet: {
		// Following UIModalPresentationFormSheet size
		// this not change on different iPad sizes
		width: 540,
		height: 620,
		overflow: 'hidden',
		borderRadius: 10
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderWidth: 3
	},
	textAlignCenter: {
		textAlign: 'center'
	},
	alignItemsFlexEnd: {
		alignItems: 'flex-end'
	},
	alignItemsFlexStart: {
		alignItems: 'flex-start'
	},
	textAlignRight: {
		textAlign: 'right'
	},
	opacity5: {
		opacity: 0.5
	},
	bottomText: {
		justifyContent: 'center',
		flexDirection: 'row',
		fontSize: moderateScale(20),
		paddingTop: 10,
		paddingBottom: 10
	},
	loginTitle: {
		fontSize: 20,
		marginVertical: 30,
		lineHeight: 28,
		textAlign: 'center'
	},
	loginSubtitle: {
		fontSize: 16,
		color: '#54585e',
		lineHeight: 20,
		marginBottom: 15
	},
	descriptionText: {
		fontSize: 16,
		lineHeight: 20,
		marginBottom: 15
	},
	headerButton: {
		backgroundColor: 'transparent',
		height: 44,
		width: 44,
		alignItems: 'center',
		justifyContent: 'center'
	},
	footerButton: {
		height: 25,
		width: 75,
		marginTop: 6,
		alignItems: 'center',
		justifyContent: 'center'
	},
	navigationHeaderImage: {
		height: 36,
		width: 152,
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		resizeMode: 'contain'
	},
	separator: {
		height: StyleSheet.hairlineWidth
	},
	separatorTop: {
		borderTopWidth: StyleSheet.hairlineWidth
	},
	separatorBottom: {
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separatorVertical: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderBottomWidth: StyleSheet.hairlineWidth
	},
	separatorLeft: {
		borderLeftWidth: StyleSheet.hairlineWidth
	},
	textRegular: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '400'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'normal'
			}
		})
	},
	textMedium: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '500'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif-medium',
				fontWeight: 'normal'
			}
		})
	},
	 textSemibold: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '600'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'bold'
			}
		})
	},
	textBold: {
		backgroundColor: 'transparent',
		...Platform.select({
			ios: {
				fontFamily: 'System',
				fontWeight: '700'
			},
			android: {
				includeFontPadding: false,
				fontFamily: 'sans-serif',
				fontWeight: 'bold'
			}
		})
	},
	inputLastChild: {
		marginBottom: 15
	},
	notchLandscapeContainer: {
		marginTop: -34,
		paddingHorizontal: 30
	},
	settingIcon: {
		backgroundColor: 'transparent',
		height: 30,
		width: 30,
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardIconSmall: {
		backgroundColor: 'transparent',
		height: 36,
		width: 36,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

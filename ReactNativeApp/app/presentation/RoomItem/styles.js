import { StyleSheet, PixelRatio } from 'react-native';

import sharedStyles from '../../views/Styles';
import { isIOS } from '../../utils/deviceInfo';

export const ROW_HEIGHT = 75 * PixelRatio.getFontScale();
export const ACTION_WIDTH = 80;
export const SMALL_SWIPE = ACTION_WIDTH / 2;
export const LONG_SWIPE = ACTION_WIDTH * 3;

export default StyleSheet.create({
	flex: {
		flex: 1
	},
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 10,
		height: ROW_HEIGHT
	},
	centerContainer: {
		flex: 1,
		paddingTop: 10,
		height: '100%'
	},
	rightContainer: {
		width: 64,
		justifyContent: 'center',
		alignItems: 'center',
		height: '100%'
	},
	title: {
		flex: 1,
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textMedium
	},
	cardNameText: {
		fontSize: 10,
		color: '#0C0D0F',
		fontWeight: '400',
		paddingTop: 0,
		paddingBottom: 0,
		textAlign: 'center',
		width: '100%'
	},
	alert: {
		...sharedStyles.textSemibold
	},
	row: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	avatar: {
		marginRight: 10
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardTextContainer: {
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	cardImageContainer: {
		width: '100%',
		marginTop: isIOS ? 5 : 2,
		marginLeft: 4,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	date: {
		fontSize: 13,
		marginLeft: 4,
		marginRight: 8,
		...sharedStyles.textRegular
	},
	updateAlert: {
		...sharedStyles.textSemibold
	},
	status: {
		position: 'absolute',
		bottom: 14,
		left: 48,
		borderColor: '#fff',
		borderWidth: 1
	},
	markdownText: {
		flex: 1,
		color: '#9EA2A8',
		fontWeight: 'normal',
		marginRight: 8
	},
	markdownTextAlert: {
		color: '#0C0D0F'
	},
	upperContainer: {
		overflow: 'hidden'
	},
	actionsContainer: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: ROW_HEIGHT
	},
	actionText: {
		fontSize: 15,
		justifyContent: 'center',
		marginTop: 4,
		textAlign: 'center',
		...sharedStyles.textSemibold
	},
	actionLeftButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0,
		right: 0
	},
	actionRightButtonContainer: {
		position: 'absolute',
		height: ROW_HEIGHT,
		justifyContent: 'center',
		top: 0
	},
	actionButton: {
		width: ACTION_WIDTH,
		height: '100%',
		alignItems: 'center',
		justifyContent: 'center'
	}
});

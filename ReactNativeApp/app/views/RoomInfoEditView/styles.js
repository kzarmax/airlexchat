import { StyleSheet } from 'react-native';

import { COLOR_DANGER, COLOR_SEPARATOR } from '../../constants/colors';

export default StyleSheet.create({
	buttonInverted: {
		borderColor: 'rgba(0,0,0,.15)',
		borderWidth: 2,
		borderRadius: 2
	},
	buttonContainerDisabled: {
		backgroundColor: 'rgba(65, 72, 82, 0.7)'
	},
	buttonDanger: {
		borderColor: COLOR_DANGER,
		borderWidth: 2,
		borderRadius: 2
	},
	colorDanger: {
		color: COLOR_DANGER
	},
	switchContainer: {
		flexDirection: 'row',
		alignItems: 'flex-start'
	},
	switchLabelContainer: {
		flex: 1,
		paddingHorizontal: 10
	},
	switchLabelPrimary: {
		fontSize: 16,
		paddingBottom: 6
	},
	switchLabelSecondary: {
		fontSize: 12
	},
	switch: {
		alignSelf: 'center'
	},
	divider: {
		height: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		borderBottomWidth: StyleSheet.hairlineWidth,
		marginVertical: 20
	},
	broadcast: {
		fontWeight: 'bold',
		textAlign: 'center'
	},
	btnArea: {
		marginTop: 20
	},
	rowContainer: {
		marginBottom: 10,
		flex: 1,
		flexDirection: 'row'
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10
	},
	avatarSide: {
		marginLeft: 20,
		flex: 1
	},
	resetButton: {
		padding: 4,
		borderRadius: 4,
		position: 'absolute',
		bottom: -8,
		right: -8
	},
	subAvatarIcon:{
		position: 'absolute',
		bottom: 0,
		right: 0,
		padding: 2,
		borderRadius: 12,
		backgroundColor: 'gray'
	}
});

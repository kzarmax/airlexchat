import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	content: {
		padding: 16,
		width: '100%',
		borderRadius: 4
	},
	title: {
		fontSize: 16,
		paddingBottom: 8,
		...sharedStyles.textBold,
		...sharedStyles.textAlignCenter
	},
	subtitle: {
		fontSize: 14,
		paddingBottom: 8,
		...sharedStyles.textRegular,
		...sharedStyles.textAlignCenter
	},
	sendEmail: {
		fontSize: 14,
		paddingBottom: 24,
		paddingTop: 8,
		alignSelf: 'center',
		...sharedStyles.textRegular
	},
	button: {
		marginBottom: 0
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between'
	},
	tablet: {
		height: undefined
	},
	androidButton: {
		borderRadius: 10,
		justifyContent: 'center',
		height: 48,
		width: 120,
		shadowColor: '#000',
		shadowRadius: 2,
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 2
		},
		elevation: 8
	},
	androidButtonText: {
		fontSize: 18,
		textAlign: 'center'
	},
});

import { StyleSheet, Platform } from 'react-native';

export default StyleSheet.create({
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10
	},
	textContainer: {
		marginVertical: 10
	},
	btnContainer: {
		marginTop: 24
	},
	OAuthInfoContainer: {
		alignItems: 'flex-start',
		justifyContent: 'flex-start',
		flex: 1,
		flexDirection: 'row'
	},
	avatarButtons: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		justifyContent: 'flex-start'
	},
	avatarButton: {
		backgroundColor: '#e1e5e8',
		width: 50,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 15,
		marginBottom: 15,
		borderRadius: 2
	},
	icon: {
		width: 35,
		height: 35,
		marginHorizontal: 20,
		resizeMode: 'contain'
	},
	dialogInput: Platform.select({
		ios: {},
		android: {
			borderRadius: 4,
			borderColor: 'rgba(0,0,0,.15)',
			borderWidth: 2,
			paddingHorizontal: 10
		}
	})
});

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	textCenter: {
		marginTop: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
		flex: 0.2
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
		flexDirection: 'row',
		marginLeft: '20%'
	},
	avatarSide: {
		marginLeft: 20,
		flex: 1,
		flexDirection: 'column'
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
	swiperArea: {
		height: 350,
		marginTop: 30
	},
	commentArea: {
		flex: 0.2,
		marginBottom: 30
	},
	btnArea: {
		marginTop: 20,
		flex: 0.2
	},
	selectCard: {
		flex: 0.8,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: '#CCCCCC',
		borderWidth: 0.5,
		paddingBottom: 20
	},
	cardName: {
		marginTop: 10,
		fontWeight: '600'
	},
	comment: {
		marginTop: 10,
		fontWeight: '600'
	},
	cardMessage: {
		marginTop: 10
	},
	commentValue: {
		marginTop: 10,
		padding: 10
	},
	afterAddText: {
		fontWeight: '600',
		marginBottom: 20
	},
	sceneArea: {
		marginTop: 25
	},
	sceneName: {
		fontWeight: '600'
	},
	sceneValue: {
		marginTop: 10,
		marginLeft: 20,
		fontWeight: '600'
	}
});

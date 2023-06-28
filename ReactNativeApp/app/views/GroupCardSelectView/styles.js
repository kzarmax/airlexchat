import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	textCenter: {
		marginTop: 20,
		alignItems: 'center',
		justifyContent: 'center',
		height: '10%'
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
		//height: 320,
		marginTop: 0
	},
	btnArea: {
		padding: 10
	},
	selectCard: {
		flex: 0.8,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: '#CCCCCC',
		borderWidth: 0.5,
		paddingBottom: 32,
		paddingHorizontal: 48
	},
	cardName: {
		marginTop: 10,
		fontWeight: '600'
	},
	cardMessage: {
		marginTop: 10
	},
	slide1: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#9DD6EB'
	},
	slide2: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#97CAE5'
	},
	slide3: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#92BBD9'
	},
	text: {
		color: '#fff',
		fontSize: 30,
		fontWeight: 'bold'
	}
});

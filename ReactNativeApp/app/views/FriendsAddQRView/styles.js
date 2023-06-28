import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	qrView: {
		flex: 1
	},
	white: {
		fontWeight: 'bold'
	},
	cameraTop: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 15,
		marginBottom: 15,
		flex: 0.1
	},
	cameraBottom: {
		flex: 0.2,
		marginTop: 30,
		marginLeft: 15,
		marginRight: 15
	},
	cameraView: {
		flex: 0.7,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: '10%',
		textAlign: 'center',
	},
	qrContainer: {
		borderRadius: 8,
		backgroundColor: 'white',
		padding: 16,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cameraCont: {
		width: '90%'
	},
	cameraMain: {
		width: '100%'
	},
	qrcode:{
		width: 250,
		height: 250,
		zIndex: 100
	},
	logoImage:{
		position: 'absolute',
		width: 60,
		height: 60,
		borderWidth: 2,
		borderColor: 'white',
		borderRadius: 30,
		zIndex: 101
	}
});

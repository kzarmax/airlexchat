import { StyleSheet, ImageBackgroundComponent } from 'react-native';

export default StyleSheet.create({
	bkColor: {
		backgroundColor: '#2d3741',
		flex: 1
	},
	container: {
		flex: 1
	},
	white: {
		color: '#FFFFFF',
		fontWeight: 'bold'
	},
	cameraTop: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 15,
		paddingBottom: 15,
		backgroundColor: '#2d3741',
		zIndex: 10
	},
	cameraBottom: {
		marginTop: 0,
		marginLeft: 15,
		marginRight: 15,
		paddingTop: 15,
		paddingBottom: 15,
		backgroundColor: '#2d3741',
		zIndex: 10
	},
	cameraView: {
		flexGrow: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'transparent',
	},
	cameraCont: {
		width: '90%',
	},
	cameraMain: {
		width: '100%',
		height: '100%',
		overflow: 'hidden'
	},
	tabBarContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderBottomWidth: 2,
		borderBottomColor: 'lightgray',
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4
	},
	tab: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	tabText: {
		fontSize: 14,
		paddingBottom: 8
	},
	title: {
		textAlign: 'center',
		fontSize: 20,
		paddingVertical: 8,
		color: 'black'
	},
	selectCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10
	},
	cardDataContainer: {
		paddingTop: 20,
	},
	cardName: {
		marginTop: 10,
		fontWeight: '600'
	},
	cardMessage: {
		marginTop: 10
	},
	avatarContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		marginLeft: '20%',
		marginBottom: 30
	},
	avatarSide: {
		marginLeft: 20,
		flex: 1,
		flexDirection: 'column'
	},
	inviteBtn: {
		alignItems: 'center'
	}
});

import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff'
	},
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
		backgroundColor: 'white',
		marginHorizontal: '10%',
		textAlign: 'center',
		borderRadius: 8
	},
	qrcode:{
		width: 250,
		height: 250
	},
	logoImage:{
		position: 'absolute',
		width: 80,
		height: 80,
		borderWidth: 4,
		borderColor: 'white',
		borderRadius: 40
	},
	cameraCont: {
		width: '90%'
	},
	cameraMain: {
		width: '100%'
	},
	toggleDropdownContainer: {
		height: 46,
		flexDirection: 'row',
		alignItems: 'center'
	},
	toggleDropdownIcon: {
		marginLeft: 20,
		marginRight: 17
	},
	toggleDropdownText: {
		flex: 1,
		fontSize: 17,
		...sharedStyles.textRegular
	},
	toggleDropdownArrow: {
		marginRight: 15
	},
	dropdownContainer: {
		width: '100%',
		position: 'absolute',
		top: 0
	},
	backdrop: {
		...StyleSheet.absoluteFill
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	},
	cardData: {
		flex: 1,
	},
	selectCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 20
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
		flex: 1,
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
	},
	tabBarContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		borderBottomWidth: 2,
		borderBottomColor: 'lightgray',
		borderBottomLeftRadius: 4,
		borderBottomRightRadius: 4,
		marginTop: 8
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
});

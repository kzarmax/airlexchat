import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';

export default StyleSheet.create({
	SceneSelectMessageBox: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 15
	},
	SceneSelectMessage: {
		fontSize: 16,
		marginTop: 5
	},
	SceneInfoMessage: {
		fontSize: 16,
		color: 'grey',
		marginTop: 25,
		marginBottom: 20
	},
	CheckBoxContainer: {
		backgroundColor: '#FFFFFF',
		borderWidth: 0,
		marginVertical: 0
	},
	AddSceneView: {
		marginVertical: 10,
		paddingLeft: '20%'
	},
	AddSceneInput: {
		width: 300
	},
	btn_decision: {
		width: '85%',
		height: 40

	},
	BtnDecision: {
		justifyContent: 'center',
		paddingVertical: 20,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatarContainer: {
		marginBottom: 10,
		flex: 1,
		flexDirection: 'row'
	},
	idContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	idText: {
		fontSize: 20,
		fontWeight: 'bold',
		marginRight:16
	},
	avatarSide: {
		marginLeft: 20,
		flex: 1
	},
	subAvatarIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		padding: 2,
		borderRadius: 12,
		backgroundColor: 'gray'
	},
	border: {
		marginTop: 10,
		marginBottom: 20,
		height: 1,
		backgroundColor: '#eeeeee'
	},
	detailBox: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10
	},
	detailTitleArea: {
		flex: 0.43
	},
	detailTitle: {
		flex: 1
	},
	detailMainArea: {
		flex: 0.43
	},
	detailMain: {
		flex: 1
	},
	iconArea: {
		flex: 0.14
	},
	modal: {
		alignItems: 'center',
		position: 'absolute',
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		width: '100%',
		height: '100%'
	},
	modalContent: {
		top: '10%',
		marginLeft: '5%',
		marginRight: '5%',
		width: '90%',
		borderRadius: 10
	},
	modalAvater: {
		borderRadius: 10,
		marginVertical: 15,
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalAvaterName: {
		marginTop: 10
	},
	closeModalButton: {
		padding: 8,
		alignItems: 'flex-end'
	},
	modalMassage: {
		marginLeft: 10,
		marginRight: 10,
		marginBottom: 20
	},
	modalBtn: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	addSceneDetailBtn: {
		marginTop: 10
	},
	deleteBtn: {
		marginTop: 20
	},
	colorPicker: {
		width: 240,
		height: 240,
		backgroundColor: '#d7d7d7',
		padding: 12,
		borderRadius: 8
	},
	modalButton: {
		marginHorizontal: 12,
		marginVertical: 4
	}
});

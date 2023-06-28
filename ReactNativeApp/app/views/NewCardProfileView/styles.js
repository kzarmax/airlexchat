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
	avatarSide: {
		marginLeft: 20,
		flex: 1
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
	addSceneDetailBtn: {
		marginTop: 10
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

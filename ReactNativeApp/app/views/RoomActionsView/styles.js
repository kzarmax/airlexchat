import { StyleSheet } from 'react-native';
import sharedStyles from "../Styles";
import {COLOR_SEPARATOR} from "../../constants/colors";
import {isIOS} from "../../utils/deviceInfo";

export default StyleSheet.create({
	modal: {
		alignItems: 'center'
	},
	container: {
		height: 200,
		flexDirection: 'column',
		borderRadius: 12,
		padding: 16
	},
	avatarContainer: {
		marginTop: 8,
		height: 80,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	avatar: {
		marginHorizontal: 10
	},
	roomName: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1
	},
	buttonsContainer: {
		marginTop: 32,
		flexDirection: 'row',
		justifyContent: 'space-around',
		width: '80%'
	},
	buttonContainer: {
		textAlign: 'center',
		alignItems: 'center',
		flexDirection: 'column',
	},
	buttonText: {
		fontSize: 15,
		fontWeight: 'normal'
	}
});

import { StyleSheet } from 'react-native';
import { COLOR_BUTTON_DONE, COLOR_BUTTON_GRAY, COLOR_BUTTON_TEXT_PRIMARY } from '../../constants/colors';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	header: {
		padding: 16
	},
	emojiSeparator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8',
		marginVertical: 8
	},
	customCategoryEmoji: {
		margin: 16,
		width: 96,
		height: 96
	},
	titleEmoji: {
		width: 64,
		height: 64
	},
	body:{
		flexGrow: 1,
		alignItems: 'center'
	},
	btnArea: {
		borderTopWidth: 1,
		borderColor: '#CCCCCC',
		padding: 8
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		marginRight: 12
	},
	modal: {
		alignItems: 'center',
	},
	modalContent: {
		borderRadius: 12, 
		paddingVertical: 12,
		paddingHorizontal: 24,
		height: 500,
		width: 300,
		marginHorizontal: 20
	},
	sendBtn: {
		shadowColor: '#000',
		shadowRadius: 2,
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 2
		},
		elevation: 8,
		borderRadius: 6,
		marginBottom: 10,
		width: '100%',
		height: 50,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	emojiTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black'
	},
	emojiCreator: {
		fontSize: 10
	},
	enableBtn: {
		backgroundColor: COLOR_BUTTON_DONE,
	},
	disableBtn: {
		backgroundColor: COLOR_BUTTON_GRAY,
	},
	btnText:{
		color: COLOR_BUTTON_TEXT_PRIMARY,
		fontSize: 16,
		letterSpacing: 1.6,
		textAlign: 'center'
	}
});

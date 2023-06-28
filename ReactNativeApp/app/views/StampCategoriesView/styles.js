import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		padding: 4
	},
	pageTitle:{
		padding: 16,
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black'
	},
	emojiList: {
		marginTop: 12,
	},
	emojiContainer: {
		flexDirection: 'row',
		paddingBottom: 4,
		flex: 1,
		borderBottomWidth: 1,
		borderColor: '#CCCCCC'
	},
	emojiContentContainer:{

	},
	emojisContainer:{
		paddingVertical: 8
	},
	customEmoji: {
		marginHorizontal: 8,
		width: 40,
		height: 40
	},
	titleEmoji: {
		marginTop: 12,
		width: 56,
		height: 56
	},
	emojiSeparator: {
		backgroundColor: '#9ea2a8',
		height: 1,
	},
	downloadEmojiBtn: {
		paddingHorizontal: 12,
	},
	searchList: {
		opacity: 0
	},
	emojiTitle: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	emojiCreator: {
		fontSize: 10
	},
	pointContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	coinIcon: {
		...sharedStyles.settingIcon,
		height: 13,
		width: 12,
		margin: 4
	},
	point: {
		fontWeight: 'bold',
		fontSize: 14,
		paddingLeft: 4,
		color: 'red'
	},
	freeLabel: {
		fontSize: 12,
		paddingTop: 4,
		color: 'red'
	}
});

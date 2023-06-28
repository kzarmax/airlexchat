import { StyleSheet } from 'react-native';
import { isIOS } from '../../utils/deviceInfo';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
	tabBarContainer: {
		flexDirection: 'row',
		height: 45,
	},
	scrollContainer: {
		height: 40,
		//backgroundColor: '#aaa',
		marginRight: 40,
		marginTop: 4,
		//borderRadius: 12
	},
	tabsContainer: {
		height: 40,
		flexDirection: 'row',
		paddingTop: 5
	},
	tab: {
		flex: 1,
		paddingHorizontal: 8,
		alignItems: 'center',
		justifyContent: 'center',
		paddingBottom: 10
	},
	tabEmoji: {
		fontSize: 20,
		color: 'black'
	},
	activeTabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: '#007aff',
		bottom: 0
	},
	tabLine: {
		position: 'absolute',
		left: 0,
		right: 0,
		height: 2,
		backgroundColor: 'rgba(0,0,0,0.05)',
		bottom: 0
	},
	categoryContainer: {
		flex: 1,
		alignItems: 'flex-start'
	},
	categoryInner: {
		flexWrap: 'wrap',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-start',
		flex: 1
	},
	categoryEmoji: {
		color: 'black',
		backgroundColor: 'transparent',
		textAlign: 'center'
	},
	tabCustomEmoji: {
		width: 28,
		height: 28
	},
	customCategoryEmoji: {
		margin: 4
	},
	settingIcon: {
		backgroundColor: 'transparent',
		height: 30,
		width: 30
	},
	emojiTabIcon: {
		backgroundColor: 'transparent',
		height: isIOS ? 40 : 30,
		width: isIOS ? 40 : 30,
		alignItems: 'center',
		justifyContent: 'center'
	},
	addtionalEmojiBtn: {
		position: 'absolute',
		right: 0,
		paddingTop: 3
	},
	addButton: {
		margin: 8,
		alignItems: 'center',
		justifyContent: 'center',
		width: 24,
		height: 24
	},
	closePreviewButton: {
		margin: 8,
		alignItems: 'center',
		justifyContent: 'center',
		width: 24,
		height: 24,
		color: '#777b81'
	},
	emojiListContainer: {
		flex: 1,
		flexDirection: 'column'
	},
	emojiList: {
		flex:1
	},
	categoryIcon: {
		paddingVertical: 12,
		paddingHorizontal: 24,
		fontWeight: 'bold'
	}
});

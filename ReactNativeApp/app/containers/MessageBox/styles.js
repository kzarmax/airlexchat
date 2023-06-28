import { StyleSheet, Dimensions } from 'react-native';

import { isIOS } from '../../utils/deviceInfo';
import sharedStyles from '../../views/Styles';

const MENTION_HEIGHT = 50;
const SCROLLVIEW_MENTION_HEIGHT = 4 * MENTION_HEIGHT;

export default StyleSheet.create({
	textBox: {
		flex: 0,
		alignItems: 'center',
		borderTopWidth: StyleSheet.hairlineWidth,
		zIndex: 2
	},
	compressingContainer:{
		position: 'absolute',
		height: Dimensions.get('window').height,
		display: 'flex',
		alignItems: 'center',
		top: -50,
		width: '100%',
	},
	composer: {
		flexDirection: 'column',
		borderTopWidth: StyleSheet.hairlineWidth
	},
	textArea: {
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		backgroundColor: '#fff'
	},
	textBoxInput: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
		borderRadius:18,
 		maxHeight: 242,
		textAlignVertical: 'center',
		flexGrow: 1,
		marginVertical: 2
	},
	input: {
		flexGrow: 1,
		paddingVertical: 6,
		paddingLeft: 8,
		textAlignVertical: 'center',
		fontSize: 15,
		flex: 1,
		maxHeight: 100,
		marginLeft: 8,
	},
	actionButton: {
		marginHorizontal: 10,
		alignItems: 'center',
		justifyContent: 'center',
		width: 30,
		height: 30
	},
	modeButton:{
		marginRight: 4,
		alignItems: 'center',
		justifyContent: 'center',
		width: 30,
		height: 30
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	actionButtons:{
		flexDirection: 'row',
	},
	styleButton: {
		margin: 10,
		alignItems: 'center',
		justifyContent: 'center',
		width: 30,
		height: 30
	},
	// sendButton: {
	// 	marginRight: 8,
	// 	marginLeft: 4,
	// 	alignItems: 'center',
	// 	justifyContent: 'center',
	// 	width: 46,
	// 	height: 30
	// },
	sendButton: {
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 8
	},
	sendText: {
		padding: 6,
		borderWidth: 1,
		borderRadius: 8,
		textAlign: 'center',
		fontWeight: 'bold'
	},
	mentionList: {
		maxHeight: MENTION_HEIGHT * 4
	},
	mentionItem: {
		height: MENTION_HEIGHT,
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 5
	},
	mentionItemCustomEmoji: {
		margin: 8,
		width: 30,
		height: 30
	},
	mentionItemEmoji: {
		width: 46,
		height: 36,
		fontSize: isIOS ? 30 : 25,
		textAlign: 'center'
	},
	previewContainer: {
		backgroundColor: 'rgba(0,0,0,0.4)',
		position: 'absolute',
		top: -132,
		paddingVertical: 16
	},
	previewCustomEmojiContainer: {
		width: '100%',
		alignItems: 'center',
		top: -8,
		left: 0
	},
	previewCustomEmoji:{
		width: 100,
		height: 100,
		paddingVertical: 8
	},
	closeButton: {
		padding: 8,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},
	fixedMentionAvatar: {
		textAlign: 'center',
		width: 46,
		fontSize: 14,
		...sharedStyles.textBold
	},
	mentionText: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	emojiKeyboardContainer: {
		flex: 1,
		borderTopWidth: StyleSheet.hairlineWidth
	},
	slash: {
		height: 30,
		width: 30,
		padding: 5,
		paddingHorizontal: 12,
		marginHorizontal: 10,
		borderRadius: 2
	},
	commandPreviewImage: {
		justifyContent: 'center',
		margin: 3,
		width: 120,
		height: 80,
		borderRadius: 4
	},
	commandPreview: {
		height: 100,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	avatar: {
		margin: 8
	},
	scrollViewMention: {
		maxHeight: SCROLLVIEW_MENTION_HEIGHT
	},
	recordingContent: {
		flex: 0,
		alignItems: 'center',
		borderTopWidth: StyleSheet.hairlineWidth,
		zIndex: 2
	}
});

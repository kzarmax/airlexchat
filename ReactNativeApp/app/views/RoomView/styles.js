import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR, COLOR_BUTTON_DONE } from '../../constants/colors';
import sharedStyles from '../Styles';
import { verticalScale } from '../../utils/scaling';

export default StyleSheet.create({
	container: {
		flex:1,
	},
	scrollView: {
		maxHeight: verticalScale(300)
	},
	safeAreaView: {
		flex: 1
	},
	list: {
		flex: 1
	},
	contentContainer: {
		paddingTop: 10
	},
	separator: {
		height: 1,
		backgroundColor: COLOR_SEPARATOR
	},
	sectionSeparatorBorder: {
		borderColor: '#EBEDF1',
		borderTopWidth: 1
	},
	descriptionContainer: {
		paddingVertical: 8,
		paddingLeft: 10,
		justifyContent: 'center'
	},
	itemLabel: {
		fontWeight: '600',
		marginBottom: 4
	},
	nameLabel: {
		fontWeight: '600',
		marginTop: 4,
		marginBottom: 4,
		paddingLeft: 10
	},
	loadingMore: {
		textAlign: 'center',
		padding: 15,
		color: '#ccc'
	},
	blocked: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	reactionPickerContainer: {
		borderRadius: 4,
		flexDirection: 'column',
		overflow: 'hidden'
	},
	loading: {
		flex: 1
	},
	bannerContainer: {
		paddingVertical: 12,
		paddingHorizontal: 15,
		flexDirection: 'row',
		alignItems: 'center'
	},
	bannerText: {
		flex: 1
	},
	bannerModalTitle: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	modalView: {
		padding: 20,
		justifyContent: 'center'
	},
	modalScrollView: {
		maxHeight: 100,
		marginVertical: 20
	},
	modalCloseButton: {
		alignSelf: 'flex-end'
	},
	joinRoomContainer: {
		justifyContent: 'flex-end',
		alignItems: 'center',
		marginVertical: 15
	},
	joinRoomButton: {
		width: 107,
		height: 44,
		marginTop: 15,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 2
	},
	joinRoomText: {
		fontSize: 14,
		...sharedStyles.textMedium,
		fontWeight: '500',
		color: '#0C0D0F'
	},
	previewMode: {
		fontSize: 16,
		fontWeight: '500',
		color: '#0C0D0F'
	},
	customHeaderContainer: {
		height: 56,
		paddingLeft: 15,
		paddingVertical: 6
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: 18,
		paddingLeft: 15,
		flex: 1
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	groupMemberContainer: {
		width: '100%',
		paddingTop: 2,
		paddingLeft: 30,
		paddingRight: 8,
		paddingVertical: 2
	},
	land_modal: {
		paddingHorizontal:16,
		borderRadius: 16,
	},
	port_modal: {
		borderRadius: 16,
		padding:16,
		marginVertical: '20%'
	},
	giftContainer: {
		flex: 1
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: 'black',
		paddingVertical: 8
	},
	emojiList: {
		marginTop: 12
	},
	emojiContainer: {
		flexDirection: 'row',
		paddingBottom: 8,
		marginBottom: 8,
		flex: 1,
		alignItems: 'center',
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(0,0,0,0.14)',
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
	emojiTitle: {
		fontSize: 16,
		paddingLeft: 8,
		fontWeight: 'bold',
		color: 'black',
		marginRight: 8
	},
	titleEmoji: {
		width: 20,
		height: 24
	},
	emojiSeparator: {
		backgroundColor: '#9ea2a8',
		height: 1,
	},
	downloadEmojiBtn: {
		//position: 'absolute',
		paddingLeft: 12,
		paddingRight: 8,
	},
	searchList: {
		opacity: 0
	},
	giftChildEmoji:{
		marginHorizontal: 8,
	},
	downloadTitleEmoji:{
		width: 64,
		height: 64
	},
	downloadBtn: {
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
		paddingHorizontal: 15,
		marginTop: 4,
		backgroundColor: COLOR_BUTTON_DONE
	},
	downloadText: {
		color: 'white'

	}
});

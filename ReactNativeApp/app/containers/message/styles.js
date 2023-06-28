import { StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { isTablet } from '../../utils/deviceInfo';

export default StyleSheet.create({
	root: {
		flexDirection: 'row'
	},
	container: {
		paddingVertical: 2,
		paddingHorizontal: 14,
		flexDirection: 'column',
		flex: 1
	},
	messageContent: {
		flex: 1,
		marginLeft: 46,
		alignItems: 'flex-start'
	},
	messageOwnContent: {
		flex: 1,
		marginLeft: 46,
		alignItems: 'flex-end'
	},
	messageInfoContent: {
		flex: 1,
		marginLeft: 46,
		alignItems: 'center'
	},
	messageInnerContent: {
		padding: 10,
		borderRadius: 8
	},
	giftInnerContent:{
		backgroundColor: '#f2f6f9',
		padding: 10,
	},
	giftOwnInnerContent:{
		backgroundColor: '#1d74f5',
		padding: 10,
		borderRadius: 8
	},
	messageContentWithHeader: {
		marginLeft: 10
	},
	messageContentWithError: {
		paddingLeft: 10
	},
	center: {
		alignItems: 'center'
	},
	flex: {
		flexDirection: 'row',
		flex: 1
	},
	customEmoji: {
		width: 160,
		height: 160,
		marginBottom: 2
	},
	temp: { opacity: 0.3 },
	marginTop: {
		paddingTop: 10
	},
	mention: {
		color: '#0072FE',
		fontWeight: '500',
		padding: 5
	},
	mentionLoggedUser: {
		color: '#fff',
		backgroundColor: '#1d74f5'
	},
	mentionAll: {
		color: '#fff',
		backgroundColor: '#FF5B5A'
	},
	reactionsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginTop: 2
	},
	reactionButton: {
		marginRight: 6,
		marginBottom: 2,
		borderRadius: 2
	},
	reactionContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 2,
		borderWidth: 1,
		height: 28,
		minWidth: 46.3
	},
	reactionCount: {
		fontSize: 14,
		marginLeft: 3,
		marginRight: 8.5,
		fontWeight: '600',
		color: '#1d74f5',
		...sharedStyles.textSemibold
	},
	reactionEmoji: {
		fontSize: 13,
		marginLeft: 7,
	},
	reactionCustomEmoji: {
		width: 19,
		height: 19,
		marginLeft: 7
	},
	avatar: {
	},
	avatarSmall: {
		marginLeft: 12
	},
	addReaction: {
		color: '#1d74f5'
	},
	errorButton: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15,
		paddingVertical: 5
	},
	buttonContainer: {
		marginTop: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	button: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 2
	},
	smallButton: {
		height: 30
	},
	buttonIcon: {
		marginRight: 8
	},
	buttonText: {
		fontSize: 12,
		...sharedStyles.textMedium
	},
	imageContainer: {
		flex: 1,
		width: 170
	},
	giftContainer: {
		borderRadius: 4
	},
	image: {
		height: isTablet ? 300 : 200,
		width: 170
	},
	imageIndicator: {
		width: 150
	},
	sliceImage: {
		margin: 2,
		width: isTablet ? 150 : 100,
		height: isTablet ? 150 : 100
	},
	sliceImageIndicator: {
		width: 80
	},
	imagePressed: {
		opacity: 0.5
	},
	inlineImage: {
		width: 300,
		height: 300,
		resizeMode: 'contain'
	},
	edited: {
		fontSize: 14,
		color: '#666666'
	},
	text: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	textInfo: {
		fontStyle: 'italic',
		color: '#666666',
		fontSize: 14,
		...sharedStyles.textRegular
	},
	editing: {
		backgroundColor: '#fff5df'
	},
	startedDiscussion: {
		fontStyle: 'italic',
		fontSize: 16,
		marginBottom: 6,
		...sharedStyles.textRegular
	},
	time: {
		fontSize: 12,
		paddingHorizontal: 8,
		lineHeight: 16,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	threadContainer:{
		marginRight: 64,
		alignItems: 'flex-end'
	},
	otherRepliedThread: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		marginVertical: 6,
		marginLeft: 44
	},
	ownRepliedThread: {
		flexDirection: 'row',
		flex: 1,
		alignItems: 'center',
		marginVertical: 6,
		marginLeft: 108
	},
	repliedThreadIcon: {
		marginRight: 10,
		marginLeft: 16
	},
	repliedThreadName: {
		fontSize: 16,
		...sharedStyles.textRegular
	},
	repliedThreadDisclosure: {
		marginLeft: 4,
		marginRight: 4,
		alignItems: 'center',
		justifyContent: 'center'
	},
	threadBadge: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginLeft: 8
	},
	threadBell: {
		marginLeft: 8
	},
	readReceipt: {
		lineHeight: 20
	},
	giftLabel: {
		color: '#0072FE',
		fontWeight: '500',
		padding: 5
	},
	replyThreadContainer:{
		alignItems: 'flex-start',
		marginRight: 108,
	},
	ownReplyThreadContainer:{
		paddingRight: 48,
		alignItems: 'flex-end'
	},
	giftImage:{
		width: isTablet ? 300 : 200,
		height: isTablet ? 300 : 200,
		borderRadius: 4,
	},
	mediaContainer: {

	},
	sliceMediaContainer: {
		flex: 1,
		flexWrap: 'wrap',
		width: 216,
		padding: 4,
		borderRadius: 4
	},
	mediaOver: {
		position: 'absolute',
		left: 110,
		top: 110,
		width: 100,
		height: 100,
		justifyContent: 'center',
		alignItems: 'center'
	},
	overText: {
		...sharedStyles.textSemibold,
		fontSize: 32,
		opacity: 1,
		color: 'white'
	}
});

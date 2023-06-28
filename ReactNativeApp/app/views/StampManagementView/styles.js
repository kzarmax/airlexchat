import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	scrollView: {
		flexGrow: 1
	},
	itemContainer:{
		marginBottom: 16
	},
	sectionTitle:{
 		fontSize: 16,
		fontWeight: 'bold',
		color: 'black',
		paddingVertical: 16,
		paddingLeft: 16
	},
	emojisContainer: {
		paddingVertical: 8
	},
	emojiBody: {
		alignItems: 'center',
		marginHorizontal: 8,
	},
	customEmoji: {
		width: 80,
		height: 80
	},
	emojiLabel: {
		width: 80,
		textAlign: 'center',
		color: 'black',
	},
	btnArea: {
		borderTopWidth: 1,
		borderColor: '#CCCCCC',
		padding: 8
	},
	sectionBtnArea: {
		alignItems: 'center'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8',
		marginHorizontal: 8
		// marginLeft: 60
	}
});

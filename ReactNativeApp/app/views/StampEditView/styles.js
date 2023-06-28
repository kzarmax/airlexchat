import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	header: {
		marginTop: 16,
		paddingHorizontal: 16
	},
	emojiTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black'
	},
	emojiCreator: {
		fontSize: 12
	},
	titleEmoji: {
		width: 80,
		height: 80
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8'
	},
	emojiList: {
		flexGrow: 1
	},
	customCategoryEmoji: {
		margin: 16
	},
	pointContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	coinIcon: {
		...sharedStyles.settingIcon,
		height: 17,
		width: 16,
		margin: 4
	},
	point: {
		fontWeight: 'bold',
		fontSize: 24,
		paddingLeft: 4,
		color: 'red'
	},
	myCoinLabel:{
		color: 'red'
	},
	freeLabel: {
		paddingTop: 4,
		color: 'red'
	},
	btnArea: { 
		flexDirection:'row', 
		justifyContent: 'space-between', 
		alignItems: 'center', 
		paddingHorizontal: 16, 
		marginTop:16 
	}
});

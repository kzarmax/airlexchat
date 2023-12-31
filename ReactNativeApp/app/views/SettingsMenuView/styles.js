import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemCurrent: {
		backgroundColor: '#E1E5E8'
	},
	itemLeft: {
		marginHorizontal: 10,
		width: 32,
		alignItems: 'center',
		justifyContent: 'center'
	},
	itemCenter: {
		flex: 1
	},
	itemText: {
		marginVertical: 16,
		fontWeight: 'bold',
		color: '#292E35'
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: '#E1E5E8',
		marginVertical: 4
	},
	header: {
		paddingVertical: 16,
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerTextContainer: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	headerUsername: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	headerIcon: {
		paddingHorizontal: 10,
		color: '#292E35'
	},
	avatar: {
		marginHorizontal: 10
	},
	sectionSeparatorBorder: {
		borderTopWidth: 1
	},
	settingsMenuIcon: {
		...sharedStyles.settingIcon
	},
	settingsItemIcon: {
		width: 56,
		textAlign: 'center'
	},
	status: {
		marginRight: 5
	},
	currentServerText: {
		fontWeight: 'bold'
	},
	version: {
		marginHorizontal: 5,
		marginBottom: 5,
		fontWeight: '600',
		color: '#292E35',
		fontSize: 13
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	}
});

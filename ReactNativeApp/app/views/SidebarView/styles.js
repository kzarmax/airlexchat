import { StyleSheet } from 'react-native';
import { COLOR_SEPARATOR } from '../../constants/colors';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#34599d'
	},
	containerArea: {
		flex: 0.6,
		backgroundColor: '#3862ac'
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	itemCurrent: {
		backgroundColor: '#5c78a7'
	},
	itemLeft: {
		marginHorizontal: 10,
		width: 30,
		alignItems: 'center'
	},
	itemCenter: {
		flex: 1
	},
	itemText: {
		marginVertical: 16,
		fontWeight: 'bold',
		color: '#FFFFFF'
	},
	separator: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: COLOR_SEPARATOR,
		marginVertical: 4
	},
	header: {
		paddingVertical: 20,
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#34599d'
	},
	headerTextContainer: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center'
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
	status: {
		marginRight: 5
	},
	currentServerText: {
		...sharedStyles.textSemibold,
		fontSize: 18,
		color: '#FFFFFF'
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
	},
	btn_sort_1: {
		height: 17,
		width: 20,
		marginRight: 20
	},
	btn_sort_2: {
		height: 12,
		width: 25,
		marginRight: 20

	},
	card_all: {
		marginHorizontal: 10,
		width: 40,
		alignItems: 'center',
		height: 40

	},
	newBtnArea: {
		flex: 0.1,
		marginHorizontal: 15,
		marginVertical: 10
	},
	btn_new_card: {
		marginHorizontal: 10,
		alignItems: 'center',
		flex: 1,
		paddingVertical: 20
	},
	newCard: {
		flex: 1,
		marginVertical: 15
	},
	showSort: {
		display: 'none'
	}
});

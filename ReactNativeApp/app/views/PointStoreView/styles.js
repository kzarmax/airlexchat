import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
	stockContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: 10
	},
	headerContainer: {
		padding: 16,
	},
	titleCoinIcon:{
		...sharedStyles.settingIcon,
		height: 25,
		width: 24,
		margin: 4
	},
	coinIcon:{
		...sharedStyles.settingIcon,
		height: 21,
		width: 20,
		margin: 4
	},
	headerTitle:{
		marginVertical: 16,
		fontSize: 16
	},
	pointLabel: {
		marginRight: 8,
		fontWeight: 'bold'
	},
	headerPoint: {
		marginLeft: 4,
		fontSize: 28,
		fontWeight: 'bold',
		color: 'black'
	},
	separator: {
		height: StyleSheet.hairlineWidth,
		backgroundColor: '#E1E5E8'
		// marginLeft: 60
	},
	bodyTitle:{
		padding: 16,
	},
	list: {
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 20,
		paddingVertical: 4
	},

	pointContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},

	point: {
		marginLeft: 4,
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black'
	},
	pointText: {
		color: 'red'
	},
	purchaseBtn: {
		margin: 8,
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#66A9DD',
		paddingHorizontal: 12,
		paddingVertical: 8,
		width: 90,
		alignItems: 'center'
	},
	btnLabel:{
		color: '#66A9DD'
	}
});

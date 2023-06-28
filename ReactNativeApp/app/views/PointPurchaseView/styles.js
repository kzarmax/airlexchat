import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1,
	},
	itemContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	headerContainer: {
		padding: 16,
	},
	coinIcon:{
		...sharedStyles.settingIcon,
		height: 25,
		width: 24,
		margin: 4
	},
	headerTitle:{
		marginLeft: 12,
		fontSize: 16
	},
	priceLabel: {
		marginRight: 4,
		fontSize: 28,
		fontWeight: 'bold',
		color: 'black'
	},
	headerPoint: {
		marginLeft: 4,
		fontSize: 28,
		fontWeight: 'bold',
		color: 'black'
	},
	separator: {
		height: 1,
		backgroundColor: '#E1E5E8'
		// marginLeft: 60
	},
	resultContainer:{
		marginVertical: 8,
		marginHorizontal: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},

	pointContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},

});

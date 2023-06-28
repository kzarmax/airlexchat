import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		paddingHorizontal: 15,
	},
	itemLabel: {
		fontWeight: '600',
		marginBottom: 10
	},
	itemLabelSlider: {
		fontWeight: '600',
		marginTop: 12,
		marginBottom: 4
	},
	preview: {
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#e1e5e8',
		width: '100%',
		paddingHorizontal: 15,
		paddingBottom: 4,
		marginBottom: 12
	},
	tabBarContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	tab: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start',
		flexDirection: 'row'
	},
	activeTab: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'flex-start',
		flexDirection: 'row',
		borderBottomWidth: 2,
		borderBottomColor: '#1d74f5'
	},
	tabText: {
		fontSize: 14,
		paddingBottom: 8,
		paddingLeft: 12
	},
	colorPicker: {
		width: 200,
		height: 200,
		backgroundColor: '#d7d7d7',
		padding: 12,
		borderRadius: 8
	},
	btnContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row'
	},
	modalButton: {
		marginTop: 8,
		marginHorizontal: 12
	}
});

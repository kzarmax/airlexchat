import { StyleSheet } from 'react-native';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	textSizeContainer: {
		padding: 15,
	},
	settingsMenuIcon: {
		...sharedStyles.settingIcon,
		height: 15
	},
	sIcon: {
		...sharedStyles.settingIcon,
		height: 10,
		width: 20
	},
	mIcon: {
		...sharedStyles.settingIcon,
		height: 15
	},
	slider: {
		width: '80%'
	},
	sliderContainer: {
		justifyContent: 'space-around',
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 30
	},
	itemLabel: {
		fontWeight: '600',
		marginBottom: 10
	},
	itemLabelSlider: {
		fontWeight: '600',
		marginTop: 20,
		marginBottom: 10
	},
	preview: {
		borderRadius: 4,
		borderWidth: 1,
		borderColor: '#e1e5e8',
		width: '100%',
		padding: 15
	}
});

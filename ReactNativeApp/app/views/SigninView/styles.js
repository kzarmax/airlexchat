import { StyleSheet } from 'react-native';

import { verticalScale, moderateScale } from '../../utils/scaling';
import sharedStyles from '../Styles';

export default StyleSheet.create({
	container: {
		flex: 1
	},
	safeArea: {
		paddingBottom: 30
	},
	serviceButton: {
		borderRadius: 2,
		marginBottom: 10
	},
	serviceButtonContainer: {
		borderRadius: 2,
		borderWidth: 1,
		borderColor: '#e1e5e8',
		width: '100%',
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15
	},
	serviceIcon: {
		position: 'absolute',
		left: 15,
		top: 12,
		width: 24,
		height: 24
	},
	serviceText: {
		...sharedStyles.textRegular,
		fontSize: 16,
		color: '#2f343d'
	},
	serviceName: {
		...sharedStyles.textBold
	},
	servicesTogglerContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
		marginBottom: 30
	},
	servicesToggler: {
		width: 32,
		height: 31
	},
	separatorContainer: {
		marginTop: 5,
		marginBottom: 15
	},
	separatorLine: {
		flex: 1,
		height: 1,
		backgroundColor: '#e1e5e8'
	},
	separatorLineLeft: {
		marginRight: 15
	},
	separatorLineRight: {
		marginLeft: 15
	},
	inverted: {
		transform: [{ scaleY: -1 }]
	},
	buttonsContainer: {
		marginBottom: verticalScale(10),
		marginTop: 0,
		marginHorizontal: 32
	},
	separatorOtherwise: {
		alignSelf: 'center',
		// marginTop: verticalScale(10),
		marginBottom: verticalScale(10),
		maxHeight: verticalScale(9),
		resizeMode: 'contain',
		width: 340,
		height: 9
	},
	loginText: {
		...sharedStyles.bottomText
	},
	textLink: {
		...sharedStyles.link
	},
	signinButton: {
		width: '100%',
		// height: 48,
		alignItems: 'center',
		justifyContent: 'center'
	},
	signinButtonImage: {
		alignSelf: 'center',
		// marginTop: verticalScale(10),
		marginBottom: verticalScale(10),
		maxHeight: verticalScale(61),
		resizeMode: 'contain',
		width: 346,
		height: 61
	}

});

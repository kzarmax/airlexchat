import React from 'react';
import {
	StyleSheet, Text, View
} from 'react-native';

import sharedStyles from './Styles';
import I18n from '../i18n';
import { isAndroid } from '../utils/deviceInfo';
import { CloseGoSignIn } from '../containers/HeaderButton';
import StatusBar from '../containers/StatusBar';
import { verticalScale } from '../utils/scaling';
import {withTheme} from "../theme";
import PropTypes from "prop-types";
import {themes} from "../constants/colors";

const styles = StyleSheet.create({
	description: {
		marginTop: verticalScale(10),
		fontSize: 16,
		lineHeight: 20,
		textAlign: 'center'
	},
	notice: {
		marginVertical: verticalScale(20),
		marginHorizontal: verticalScale(20),
	},
	noticeAndroid: {
		marginBottom: verticalScale(20),
		marginHorizontal: verticalScale(20),
		color: 'red'
	}
});

class RegisterCompleteView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseGoSignIn navigation={navigation} testID='new-message-view-close' />,
		title: I18n.t('Terms_of_Service')
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	};

	render() {
		const { theme } = this.props;
		return (
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }} testID='tmp-reg-view'>
				<StatusBar />
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, {color: themes[theme].titleText}]}>{I18n.t('Temporary_registration_success')}</Text>
				{isAndroid
					? <Text style={ styles.noticeAndroid }>{I18n.t('Temporary_registration_notice_android')}</Text>
					: null
				}
				<Text style={{ ...styles.description, color: themes[theme].auxiliaryText}}>{I18n.t('Temporary_registration_desc')}</Text>
				<Text style={{ ...styles.notice, color: themes[theme].auxiliaryText }}>{I18n.t('Temporary_registration_notice')}</Text>
			</View>
		);
	}
}


export default withTheme(RegisterCompleteView);
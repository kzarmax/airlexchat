/**
 * @deprecated Use deep linking instead
 */
import React from 'react';
import PropTypes from 'prop-types';
import { WebView } from 'react-native-webview';
import { connect } from 'react-redux';

import styles from './Styles';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import {View} from "react-native";

@connect(state => ({
	termsService: state.settings.Layout_Terms_of_Service
}))
export default class TermsServiceView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Terms_of_Service')
	};

	static propTypes = {
		termsService: PropTypes.string
	};

	render() {
		const { termsService } = this.props;
		return (
			<View style={styles.container} testID='terms-view'>
				<StatusBar />
				<WebView originWhitelist={['*']} source={{ html: termsService, baseUrl: '' }} />
			</View>
		);
	}
}

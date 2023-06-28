import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, Image, Animated, TouchableOpacity, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from '../../containers/SafeAreaView';
import equal from 'deep-equal';

import OAuthLogin from '../../containers/OAuthLogin';
import styles from './styles';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import {appStart as appStartAction} from "../../actions/app";
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

const SERVICES_COLLAPSED_HEIGHT = 174;

class SigninView extends React.Component {

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		services: PropTypes.object,
		appStart: PropTypes.func,
		Site_Name: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			collapsed: true,
			servicesHeight: new Animated.Value(SERVICES_COLLAPSED_HEIGHT)
		};
		const { Site_Name } = this.props;
		this.setTitle(Site_Name);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { collapsed, servicesHeight } = this.state;
		const { server, Site_Name, services } = this.props;
		if (nextState.collapsed !== collapsed) {
			return true;
		}
		if (nextState.servicesHeight !== servicesHeight) {
			return true;
		}
		if (nextProps.server !== server) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (!equal(nextProps.services, services)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const { Site_Name } = this.props;
		if (Site_Name && prevProps.Site_Name !== Site_Name) {
			this.setTitle(Site_Name);
		}
	}

	setTitle = (title) => {

	}

	login = () => {
		const { navigation } = this.props;
		navigation.navigate('LoginView');
	}

	register = () => {
		const { navigation } = this.props;
		navigation.replace('SignupView');
	}

	render() {
		const { navigation, services, theme } = this.props;

		return (
			<View testID='welcome-view' forceInset={{ bottom: 'never' }} style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				<Text style={{ ...sharedStyles.loginTitle, ...sharedStyles.textBold, color: themes[theme].titleText }}>{I18n.t('Login')}</Text>
				<View style={styles.buttonsContainer}>
					<OAuthLogin navigation={navigation} services={services} isSignup={false} />
					{ theme === 'light' ?
						<Image style={styles.separatorOtherwise} source={{ uri: 'or_line' }} fadeDuration={0} />
						:
						<View style={{ backgroundColor: themes[theme].auxiliaryTintColor, height: StyleSheet.hairlineWidth, marginBottom: 12, marginTop: 4 }} theme={theme}/>
					}
					<Button
						text={I18n.t('Login_with_email')}
						type='primary'
						size='z'
						onPress={this.login}
						testID='onboarding-view-register'
						theme={theme}
					/>
					<View style={styles.loginText}>
						<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('if_you_have_not_registered')}</Text>
						<Text style={{ ...styles.textLink, color: themes[theme].auxiliaryText }} onPress={this.register}>{I18n.t('Here')}</Text>
					</View>
				</View>
			</View>
		);
	}
}


const mapStateToProps = state => ({
	server: state.server.server,
	Site_Name: state.settings.Site_Name,
	services: state.login.services
});

const mapDispatchToProps = dispatch => ({
	appStart: root => dispatch(appStartAction(root))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SigninView));

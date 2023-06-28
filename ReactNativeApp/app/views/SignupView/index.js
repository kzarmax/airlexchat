import React from 'react';
import {
	View, Text, Image, BackHandler, StyleSheet
} from 'react-native';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Orientation from 'react-native-orientation-locker';
import equal from 'deep-equal';
import { request, PERMISSIONS } from 'react-native-permissions';

import {
	selectServerRequest, serverInitAdd, serverFinishAdd
} from '../../actions/server';
import {appStart as appStartAction, ROOT_INSIDE} from '../../actions/app';
import I18n from '../../i18n';
import styles from './styles';
import OAuthLogin from '../../containers/OAuthLogin';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class SignupView extends React.Component {
	static navigationOptions = () => ({
		headerShown: false
	});

	static propTypes = {
		navigation: PropTypes.object,
		adding: PropTypes.bool,
		selectServer: PropTypes.func.isRequired,
		currentServer: PropTypes.string,
		initAdd: PropTypes.func,
		finishAdd: PropTypes.func,
		appStart: PropTypes.func,
		services: PropTypes.object,
		connecting: PropTypes.bool.isRequired,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		this.previousServer = props.route.params?.previousServer;
		Orientation.lockToPortrait();
		this.state = {
			// services: []
		};
		request(
			Platform.select({
				android: PERMISSIONS.ANDROID.CAMERA,
				ios: PERMISSIONS.IOS.CAMERA,
			}),
		).then(() => (
			request(Platform.select({
					android: PERMISSIONS.ANDROID.RECORD_AUDIO,
					ios: PERMISSIONS.IOS.MICROPHONE,
				}),
			)));
	}

	componentDidMount() {
		const { initAdd } = this.props;
		if (this.previousServer) {
			initAdd();
		}
	}

	shouldComponentUpdate(nextProps) {
		const { connecting, services } = this.props;
		if (nextProps.connecting !== connecting) {
			return true;
		}
		if (!equal(nextProps.services, services)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		const {
			selectServer, currentServer, adding, finishAdd
		} = this.props;
		if (adding) {
			if (this.previousServer !== currentServer) {
				selectServer(this.previousServer);
			}
			finishAdd();
		}
		BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
	}

	handleBackPress = () => {
		// const { appStart } = this.props;
		// appStart({root:ROOT_BACKGROUND});
		return false;
	}

	close = () => {
		const { appStart } = this.props;
		appStart({root:ROOT_INSIDE});
	}

	login = () => {
		const { navigation } = this.props;
		navigation.replace('SigninView');
	}

	register = () => {
		const { navigation } = this.props;
		navigation.navigate('RegisterView');
	}

	render() {
		const { navigation, services, theme } = this.props;

		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='onboarding-view'>
				<StatusBar light />
				<Image style={styles.onboarding} source={{ uri: 'logo_square' }} fadeDuration={0} />
				<View style={[styles.buttonsContainer]}>
					<OAuthLogin navigation={navigation} services={services} isSignup />
					{ theme === 'light' ?
						<Image style={styles.separatorOtherwise} source={{ uri: 'or_line' }} fadeDuration={0} />
						:
						<View style={{ backgroundColor: themes[theme].auxiliaryTintColor, height: StyleSheet.hairlineWidth, marginBottom: 12, marginTop: 4 }} theme={theme}/>
					}
					<Button
						text={I18n.t('Register_with_email')}
						type='primary'
						size='z'
						onPress={this.register}
						testID='onboarding-view-register'
						theme={theme}
					/>
					<View style={styles.loginText}>
						<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('if_you_have_already_registered')}</Text>
						<Text style={{ ...styles.textLink, color: themes[theme].auxiliaryText }} onPress={this.login}>{I18n.t('Here')}</Text>
					</View>
				</View>
			</View>
		);
	}
}



const mapStateToProps = state => ({
	connecting: state.server.connecting,
	currentServer: state.server.server,
	adding: state.server.adding,
	services: state.login.services
});

const mapDispatchToProps = dispatch => ({
	initAdd: () => dispatch(serverInitAdd()),
	finishAdd: () => dispatch(serverFinishAdd()),
	selectServer: server => dispatch(selectServerRequest(server)),
	appStart: root => dispatch(appStartAction(root))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SignupView));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, Image, ScrollView, SafeAreaView, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import StatusBar from '../../containers/StatusBar';
import random from '../../utils/random';
import { Base64 } from 'js-base64';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class AccountVerifyView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Account_Confirm')
	})

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		user: PropTypes.object,
		Accounts_CustomFields: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			cardId: props.route.params?.cardId,
			confirming: false,
			name: null,
			username: null,
			email: null,
			password: null,
			avatarUrl: null,
			avatar: {},
			avatarSuggestions: {},
			customFields: {}
		}
	}

	async componentDidMount() {
		const { server } = this.props;
		await RocketChat.getLoginServices(server);
		this.init();
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (!equal(nextState, this.state)) {
			return true;
		}
		if (!equal(nextProps, this.props)) {
			return true;
		}
		return false;
	}

	init = (user) => {
		const { user: userProps } = this.props;
		const {
			name, username, emails, customFields
		} = user || userProps;

		this.setState({
			name,
			username,
			email: emails ? emails[0].address : null,
			password: null,
			avatarUrl: null,
			avatar: {},
			customFields: customFields || {}
		});
	}

	handleError = (e) => {
		if (e.data && e.data.error === 'error-too-many-requests') {
			return showErrorAlert(e.data.error);
		} else if (e.data && e.data.error === 'totp-required'){
			return this.onVerify();
		}
		showErrorAlert(
			I18n.t('error-not-authorized'),
			'',
			() => {}
		);
	}

	submit = async() => {
		Keyboard.dismiss();

		this.setState({ confirming: true });

		const {
			email, password
		} = this.state;

		const params = {};

		// Email
		params.email = email;

		// Password
		if (password) {
			params.password = password;
		}

		try {
			const result = await RocketChat.login({user: email, password, code:''});
			console.log('result', result);
			if (result) {
				this.setState({ confirming: false });
				this.onVerify();
			}
		} catch (e) {
			this.setState({ confirming: false, password: null });
			this.handleError(e);
		}
	}

	onVerify = () => {
		const { navigation } = this.props;
		const { cardId } = this.state;
		navigation.replace("ResetCardPasswordView", { cardId: cardId });
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	onPressApple = () => {
		const { services, server } = this.props;
		const { clientId } = services.apple;
		const endpoint = 'https://appleid.apple.com/auth/authorize';
		const redirect_uri = `${ server }/_oauth/apple?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?response_type=code&response_mode=form_post&client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&scope=${ scope }`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressFacebook = () => {
		const { services, server } = this.props;
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	openOAuth = (oAuthUrl) => {
		const { navigation } = this.props;
		const { cardId } = this.state;
		navigation.replace('AuthenticationWebView', { url: oAuthUrl, authType: 'oauth', isVerify:true, cardId });
	}

	render() {
		const {
			email, password, confirming
		} = this.state;
		const { user, theme } = this.props;
		const { services } = user;

		// Google+アカウント
		if (services && services.google) {
			return (
				<KeyboardView
					contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
					keyboardVerticalOffset={128}
				>
					<StatusBar />
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='account-view-list'
						{...scrollPersistTaps}
					>
						<SafeAreaView style={sharedStyles.container} testID='account-view' forceInset={{ vertical: 'never' }}>
							<View style={styles.textContainer} testID='account-view-description'>
								<Text  style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Verify_Text_OAuth')}</Text>
							</View>
							<View style={styles.OAuthInfoContainer} testID='account-view-oauth'>
								<Image source={{ uri: 'icon_google' }} style={styles.icon} />
								{
									services.google.email ?
										<View>
											<Text style={{ ...sharedStyles.textBold, color: themes[theme].bodyText }}>{I18n.t('Account_Id')}</Text>
											<Text style={{ color: themes[theme].bodyText }}>{services.google.email}</Text>
										</View> : null
								}
							</View>
							<View style={styles.btnContainer} testID='account-view-google-button'>
								<Button
									title={I18n.t('Confirm')}
									type='primary'
									onPress={this.onPressGoogle}
									testID='account-verify-view-google-button'
									size='w'
									loading={confirming}
									theme={theme}
								/>
							</View>
						</SafeAreaView>
					</ScrollView>
				</KeyboardView>
			);
		}

		// facebookアカウント
		if (services && services.facebook) {
			return (
				<KeyboardView
					contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
					keyboardVerticalOffset={128}
				>
					<StatusBar />
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='account-view-list'
						{...scrollPersistTaps}
					>
						<SafeAreaView style={sharedStyles.container} testID='account-view' forceInset={{ vertical: 'never' }}>
							<View style={styles.textContainer} testID='account-view-description'>
								<Text  style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Verify_Text_OAuth')}</Text>
							</View>
							<View style={styles.OAuthInfoContainer} testID='account-view-oauth'>
								<Image source={{ uri: 'icon_facebook' }} style={styles.icon} />
								{
									services.facebook.email ?
										<View>
											<Text style={{ ...sharedStyles.textBold, color: themes[theme].bodyText }}>{I18n.t('Account_Id')}</Text>
											<Text style={{ color: themes[theme].bodyText }}>{services.facebook.email}</Text>
										</View>
										:
										<View>
											<Text style={{ ...sharedStyles.textBold, color: themes[theme].bodyText }}>{I18n.t('Account_Name')}</Text>
											<Text style={{ color: themes[theme].bodyText }}>{services.facebook.name}</Text>
										</View>
								}
							</View>
							<View style={styles.btnContainer} testID='account-view-facebook-button'>
								<Button
									title={I18n.t('Confirm')}
									type='primary'
									onPress={this.onPressFacebook}
									testID='account-verify-view-facebook-button'
									size='w'
									loading={confirming}
									theme={theme}
								/>
							</View>
						</SafeAreaView>
					</ScrollView>
				</KeyboardView>
			);
		}

		// appleアカウント
		if (services && services.apple) {
			return (
				<KeyboardView
					contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
					keyboardVerticalOffset={128}
				>
					<StatusBar />
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='account-view-list'
						{...scrollPersistTaps}
					>
						<SafeAreaView style={sharedStyles.container} testID='account-view' forceInset={{ vertical: 'never' }}>
							<View style={styles.textContainer} testID='account-view-description'>
								<Text style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Verify_Text_OAuth')}</Text>
							</View>
							<View style={styles.OAuthInfoContainer} testID='account-view-oauth'>
								<Image source={{ uri: 'icon_apple' }} style={styles.icon} />
								{
									services.apple.email ?
										<View>
											<Text style={{ ...sharedStyles.textBold, color: themes[theme].bodyText }}>{I18n.t('Account_Id')}</Text>
											<Text style={{ color: themes[theme].bodyText }}>{services.apple.email}</Text>
										</View>
										:
										<View>
											<Text style={{ ...sharedStyles.textBold, color: themes[theme].bodyText }}>{I18n.t('Account_Name')}</Text>
											<Text style={{ color: themes[theme].bodyText }}>{services.apple.name}</Text>
										</View>
								}
							</View>
							<View style={styles.btnContainer} testID='account-view-apple-button'>
								<Button
									title={I18n.t('Confirm')}
									type='primary'
									onPress={this.onPressApple}
									testID='account-verify-view-apple-button'
									size='w'
									loading={confirming}
									theme={theme}
								/>
							</View>
						</SafeAreaView>
					</ScrollView>
				</KeyboardView>
			);
		}

		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='account-view-list'
					{...scrollPersistTaps}
				>
					<View style={styles.textContainer} testID='account-view-description'>
						<Text style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Verify_Text_OAuth')}</Text>
					</View>
					<View style={styles.textContainer} testID='account-view-email'>
						<RCTextInput
							inputRef={(e) => { this.email = e; }}
							label={I18n.t('Email')}
							placeholder={I18n.t('Email')}
							value={email}
							editable={false}
							testID='account-view-email'
							theme={theme}
						/>
					</View>
					<View style={styles.textContainer} testID='account-view-password'>
						<RCTextInput
							inputRef={(e) => { this.password = e; }}
							label={I18n.t('Password')}
							placeholder={I18n.t('Password')}
							value={password}
							iconLeft={{vector: true, icon: 'lock-outline'}}
							onChangeText={value => this.setState({ password: value })}
							onSubmitEditing={this.submit}
							secureTextEntry
							textContentType={'oneTimeCode'}
							testID='account-verify-view-password'
							theme={theme}
						/>
					</View>
					<View style={styles.btnContainer} testID='account-view-button'>
						<Button
							title={I18n.t('Confirm')}
							type='primary'
							onPress={this.submit}
							testID='account-verify-view-button'
							size='w'
							loading={confirming}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		customFields: state.login.user && state.login.user.customFields,
		emails: state.login.user && state.login.user.emails,
		token: state.login.user && state.login.user.token,
		services: state.login.user && state.login.user.services
	},
	services: state.login.services,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	server: state.settings.Site_Url || state.server ? state.server.server : ''
});


export default connect(mapStateToProps, null)(withTheme(AccountVerifyView));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, Image, ScrollView, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import prompt from 'react-native-prompt-android';
import SHA256 from 'js-sha256';
import equal from 'deep-equal';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import {getReadableVersion} from "../../utils/deviceInfo";

class AccountView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Account_Information')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		user: PropTypes.object,
		setUser: PropTypes.func,
		theme: PropTypes.string
	}

	state = {
		saving: false,
		email: null,
		newPassword: null,
		currentPassword: null,
	}

	async componentDidMount() {
		this.init();
	}

	componentWillReceiveProps(nextProps) {
		const { user } = this.props;
		if (user !== nextProps.user) {
			this.init(nextProps.user);
		}
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
			emails
		} = user || userProps;

		this.setState({
			email: emails ? emails[0].address : null
		});
	}

	formIsChanged = () => {
		const {
			email, newPassword
		} = this.state;
		const { user } = this.props;

		// if (!email) {
		// 	return true;
		// }
		// if (!isValidEmail(email)) {
		// 	return false;
		// }
		if (newPassword && newPassword.length < 8) {
			return false;
		}
		if (newPassword && newPassword.length > 32) {
			return false;
		}

		return !(!newPassword
			&& (user.emails && user.emails[0].address === email)
		);
	}


	handleError = (e, func, action) => {
		if (e.data) {
			if(e.data.errorType === 'error-too-many-requests'){
				return showErrorAlert(I18n.t(e.data.errorType, { seconds: 30 }));
			} else if (e.data.errorType === 'error-password-same-as-current') {
				return showErrorAlert(I18n.t(e.data.errorType));
			}
		}
		showErrorAlert(
			I18n.t('There_was_an_error_while_action', { action: I18n.t(action) }),
			'',
			() => this.setState({ showPasswordAlert: false })
		);
	}

	submit = async() => {
		Keyboard.dismiss();

		if (!this.formIsChanged()) {
			return;
		}

		this.setState({ saving: true });

		const {
			email, newPassword, currentPassword
		} = this.state;
		const { user } = this.props;
		const params = {};

		// Email
		if (user.emails && user.emails[0].address !== email) {
			params.email = email;
		}

		// newPassword
		if (newPassword) {
			params.newPassword = newPassword;
		}

		// currentPassword
		if (currentPassword) {
			params.currentPassword = SHA256(currentPassword);
		}

		const requirePassword = !!params.email || newPassword;
		if (requirePassword && !params.currentPassword) {
			this.setState({ saving: false });
			prompt(
				I18n.t('Please_enter_your_password'),
				I18n.t('For_your_security_you_must_enter_your_current_password_to_continue'),
				[
					{ text: I18n.t('Cancel'), onPress: () => {}, style: 'cancel' },
					{
						text: I18n.t('Save'),
						onPress: (p) => {
							this.setState({ currentPassword: p });
							this.submit();
						}
					}
				],
				{
					type: 'secure-text',
					cancelable: false
				}
			);
			return;
		}

		try {
			const result = await RocketChat.saveUserProfile(params);

			if (result.success) {
				this.setState({ saving: false });
				showToast(I18n.t('Profile_saved_successfully'));
				this.init();
			}
		} catch (e) {
			this.setState({ saving: false, currentPassword: null });
			this.handleError(e, 'saveUserProfile', 'saving_account');
		}
	}

	render() {
		const {
			email, newPassword, saving
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
						<View style={styles.textContainer} testID='account-view-description'>
							<Text style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Information_Text_OAuth')}</Text>
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
						<View style={styles.textContainer} testID='account-view-version'>
							<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Version_no', { version: '' })}<Text style={styles.bold}>{getReadableVersion}</Text></Text>
						</View>
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
						<View style={styles.textContainer} testID='account-view-description'>
							<Text style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Information_Text_OAuth')}</Text>
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
						<View style={styles.textContainer} testID='account-view-version'>
							<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Version_no', { version: '' })}<Text style={styles.bold}>{getReadableVersion}</Text></Text>
						</View>
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
						<View style={styles.textContainer} testID='account-view-description'>
							<Text style={[sharedStyles.descriptionText, { color: themes[theme].titleText }]}>{I18n.t('Account_Information_Text_OAuth')}</Text>
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
						<View style={styles.textContainer} testID='account-view-version'>
							<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Version_no', { version: '' })}<Text style={styles.bold}>{getReadableVersion}</Text></Text>
						</View>
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
						<Text style={{ ...sharedStyles.descriptionText, color: themes[theme].titleText }}>{I18n.t('Account_Information_Text')}</Text>
					</View>
					<View style={styles.textContainer} testID='account-view-email'>
						<RCTextInput
							inputRef={(e) => { this.email = e; }}
							label={I18n.t('Email')}
							placeholder={I18n.t('Email')}
							value={email}
							onChangeText={value => this.setState({ email: value })}
							onSubmitEditing={() => { this.newPassword.focus(); }}
							testID='account-view-email'
							theme={theme}
						/>
					</View>
					<View style={styles.textContainer} testID='account-view-password'>
						<RCTextInput
							inputRef={(e) => { this.newPassword = e; }}
							label={I18n.t('New_Password')}
							placeholder={I18n.t('New_Password')}
							value={newPassword}
							onChangeText={value => this.setState({ newPassword: value })}
							onSubmitEditing={() => { this.newPassword.focus(); }}
							secureTextEntry
							textContentType={'oneTimeCode'}
							testID='account-view-new-password'
							theme={theme}
						/>
					</View>
					<View style={styles.textContainer} testID='account-view-version'>
						<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('Version_no', { version: '' })}<Text style={styles.bold}>{getReadableVersion}</Text></Text>
					</View>
					<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('Password_policy_2')}</Text>
					<View style={styles.textContainer} testID='account-view-button'>
						<Button
							title={I18n.t('Save_Changes')}
							type='primary'
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='account-view-button'
							size='w'
							loading={saving}
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
		emails: state.login.user && state.login.user.emails,
		token: state.login.user && state.login.user.token,
		services: state.login.user && state.login.user.services
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(AccountView));

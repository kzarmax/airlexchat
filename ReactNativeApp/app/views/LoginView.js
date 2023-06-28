import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, StyleSheet, Alert, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { loginRequest as loginRequestAction } from '../actions/login';
import { loginReset as loginResetAction } from '../actions/login';
import { logEvent, events } from '../utils/log';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";
import FormContainer, {FormContainerInner} from "../containers/FormContainer";

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	}
});

class LoginView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func.isRequired,
		loginReset: PropTypes.func.isRequired,
		error: PropTypes.object,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.string,
		Accounts_PasswordPlaceholder: PropTypes.string,
		isFetching: PropTypes.bool,
		failure: PropTypes.bool,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			user: '',
			password: ''
		};
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { error } = this.props;
		if (nextProps.failure && !equal(error, nextProps.error)) {
			Alert.alert(I18n.t('Oops'), I18n.t('Login_error'));
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			user, password
		} = this.state;
		const {
			isFetching, failure, error, Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, theme
		} = this.props;
		if (nextState.user !== user) {
			return true;
		}
		if (nextState.password !== password) {
			return true;
		}
		if (nextProps.isFetching !== isFetching) {
			return true;
		}
		if (nextProps.failure !== failure) {
			return true;
		}
		if (nextProps.Accounts_EmailOrUsernamePlaceholder !== Accounts_EmailOrUsernamePlaceholder) {
			return true;
		}
		if (nextProps.Accounts_PasswordPlaceholder !== Accounts_PasswordPlaceholder) {
			return true;
		}
		if (!equal(nextProps.error, error)) {
			return true;
		}
		return nextProps.theme !== theme;
	}

	componentWillUnmount() {
		const { loginReset } = this.props;
		loginReset();
	}

	valid = () => {
		const {
			user, password
		} = this.state;
		return user.trim() && password.trim();
	}

	submit = () => {
		if (!this.valid()) {
			return;
		}

		const { user, password } = this.state;
		const { loginRequest } = this.props;
		Keyboard.dismiss();
		loginRequest({ user, password });
		logEvent(events.LOGIN_DEFAULT_LOGIN, { user, password });
	}

	register = () => {
		const { navigation } = this.props;
		navigation.navigate('RegisterView');
	}

	forgotPassword = () => {
		const { navigation } = this.props;
		navigation.navigate('ForgotPasswordView');
	}

	/**
	 * Japanese password input not working with Romaji Keyboard Layout
	 * Fix this bug
	 * TextInput textContentType={'oneTimeCode'}
	 */
	renderUserForm = () => {
		const {
			Accounts_EmailOrUsernamePlaceholder, Accounts_PasswordPlaceholder, isFetching, theme
		} = this.props;
		return (
			<View style={sharedStyles.container}>
				<Text style={{ ...sharedStyles.loginTitle, ...sharedStyles.textBold, color: themes[theme].titleText }}>{I18n.t('Login_with_email')}</Text>
				<TextInput
					inputRef={(e) => { this.usernameInput = e; }}
					placeholder={Accounts_EmailOrUsernamePlaceholder || I18n.t('email')}
					keyboardType='email-address'
					returnKeyType='next'
					iconLeft='mail'
					onChangeText={value => this.setState({ user: value })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='login-view-email'
					blurOnSubmit={false}
					theme={theme}
				/>
				<TextInput
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={Accounts_PasswordPlaceholder || I18n.t('Password')}
					returnKeyType='send'
					iconLeft={{vector: true, icon: 'lock-outline'}}
					secureTextEntry
					textContentType={'oneTimeCode'}
					onSubmitEditing={this.submit}
					onChangeText={value => this.setState({ password: value })}
					testID='login-view-password'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
				/>
				<Button
					title={I18n.t('Login')}
					type='primary'
					size='z'
					onPress={this.submit}
					testID='login-view-submit'
					loading={isFetching}
					disabled={!this.valid()}
					theme={theme}
				/>
				<View style={sharedStyles.bottomText}>
					<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('if_you_forgot_your_password')}</Text>
					<Text style={{ ...sharedStyles.link, color: themes[theme].auxiliaryText }} onPress={this.forgotPassword}>{I18n.t('Here')}</Text>
				</View>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<FormContainer theme={theme} testID='login-view'>
				<FormContainerInner>
					{ this.renderUserForm() }
				</FormContainerInner>
			</FormContainer>
		);
	}
}


const mapStateToProps = state => ({
	isFetching: state.login.isFetching,
	failure: state.login.failure,
	error: state.login.error && state.login.error.data,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params)),
	loginReset : () => dispatch(loginResetAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(LoginView));

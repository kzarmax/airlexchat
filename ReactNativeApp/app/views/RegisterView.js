import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, Alert, StyleSheet, View, Keyboard
} from 'react-native';
import { connect } from 'react-redux';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { loginRequest as loginRequestAction } from '../actions/login';
import isValidEmail from '../utils/isValidEmail';
import { withTheme } from '../theme';
import { themes } from '../constants/colors';
import FormContainer, { FormContainerInner } from '../containers/FormContainer';

const shouldUpdateState = ['email', 'password', 'password_confirm', 'saving'];

const styles = StyleSheet.create({
	loginText: {
		...sharedStyles.bottomText,
		marginVertical: 20
	},
	textSize: {
		fontSize: 16
	},
	textLink: {
		...sharedStyles.link,
		fontSize: 16
	},
	noticeContainer: {
		marginTop: 20
	},
	noticeText: {
		marginBottom: 5
	}
});

class RegisterView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func,
		Accounts_EmailVerification: PropTypes.bool,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			email: '',
			password: '',
			password_confirm: '',
			saving: false,
			email_error: false,
			password_error: false,
			password_confirm_error: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	valid = () => {
		const {
			email, password, password_confirm
		} = this.state;
		return email.trim()
			&& password.trim()
			&& password_confirm.trim()
			&& isValidEmail(email)
			&& (password.trim().length >= 8)
			&& (password.trim().length <= 32)
			&& (password.trim() === password_confirm.trim());
	}

	submit = async() => {
		const { Accounts_EmailVerification } = this.props;
		const {
			email, password, password_confirm
		} = this.state;
		if (!this.valid()) {
			this.setState({
				saving: false,
				email_error: false,
				password_error: false,
				password_confirm_error: false
			});

			if (!isValidEmail(email)) {
				this.setState({ email_error: true });
			}
			if (!(password.trim().length >= 8)) {
				this.setState({ password_error: true });
			}
			if (!(password.trim().length <= 32)) {
				this.setState({ password_error: true });
			}
			if (password.trim() !== password_confirm.trim()) {
				this.setState({ password_confirm_error: true });
			}

			return;
		}
		this.setState({ saving: true });
		Keyboard.dismiss();

		const { navigation } = this.props;

		try {
			await RocketChat.register({
				email, pass: password
			});
			if (Accounts_EmailVerification) {
				navigation.replace('RegisterCompleteView');
			} else {
				navigation.replace('LoginView');
			}
		} catch (e) {
			Alert.alert(I18n.t('Oops'), e.data ? e.data.error : I18n.t('error-user-register'));
			this.setState({ saving: false });
		}
	}

	unlock = () => {
		const { navigation } = this.props;
		navigation.navigate('AccountUnlockView');
	}

	renderForm = () => {
		const {
			saving, email_error, password_error, password_confirm_error
		} = this.state;
		const { Accounts_EmailVerification, theme } = this.props;
		const textColor = themes[theme].auxiliaryText;

		return (
			<View style={sharedStyles.container}>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Sign_Up')}</Text>
				{email_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-email-address')}</Text> : null}
				<TextInput
					inputRef={(e) => { this.emailInput = e; }}
					placeholder={I18n.t('Email')}
					returnKeyType='next'
					keyboardType='email-address'
					iconLeft='mail'
					textContentType='oneTimeCode'
					onChangeText={email => this.setState({ email })}
					onSubmitEditing={() => { this.passwordInput.focus(); }}
					testID='register-view-email'
					theme={theme}
				/>
				{password_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password')}</Text> : null}
				<TextInput
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={I18n.t('Password')}
					returnKeyType='next'
					iconLeft={{ vector: true, icon: 'lock-outline' }}
					secureTextEntry
					textContentType='oneTimeCode'
					onChangeText={value => this.setState({ password: value })}
					onSubmitEditing={() => { this.passwordConfirmInput.focus(); }}
					testID='register-view-password'
					theme={theme}
				/>
				{password_confirm_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password-repeat')}</Text> : null}
				<TextInput
					inputRef={(e) => { this.passwordConfirmInput = e; }}
					placeholder={I18n.t('Repeat_Password')}
					returnKeyType='send'
					iconLeft={{ vector: true, icon: 'lock-outline' }}
					secureTextEntry
					textContentType='oneTimeCode'
					onChangeText={value => this.setState({ password_confirm: value })}
					onSubmitEditing={this.submit}
					testID='register-view-password-confirm'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
				/>
				<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('Password_policy')}</Text>
				<View style={{ alignItems: 'center' }}>
					<Button
						text={I18n.t('Next')}
						type='done'
						size='Y'
						style={{ alignItems: 'center', marginTop: 15 }}
						onPress={this.submit}
						disabled={!this.valid()}
						loading={saving}
						testID='register-view-submit'
						theme={theme}
					/>
				</View>
				{ Accounts_EmailVerification
					? (
						<View style={styles.loginText}>
							<Text style={[styles.textSize, { color: themes[theme].auxiliaryText }]}>{I18n.t('if_your_account_is_locked')}</Text>
							<Text style={[styles.textLink, { color: themes[theme].auxiliaryText }]} onPress={this.unlock}>{I18n.t('Here')}</Text>
						</View>
					)
					: null
				}
				<View style={styles.noticeContainer}>
					{[1, 2, 3, 4].map(step => (
						<Text key={step} style={[{ color: textColor }, styles.noticeText]}>{I18n.t(`Register_guide_${ step }`)}</Text>
					))}
				</View>
			</View>
		);
	}

	render() {
		const { theme } = this.props;

		return (
			<FormContainer theme={theme} testID='register-view'>
				<FormContainerInner>
					{ this.renderForm() }
				</FormContainerInner>
			</FormContainer>
		);
	}
}

const mapStateToProps = state => ({
	Accounts_EmailVerification: state.settings.Accounts_EmailVerification
});

const mapDispatchToProps = dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(RegisterView));

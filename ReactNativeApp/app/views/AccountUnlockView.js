import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import PropTypes from 'prop-types';

import KeyboardView from '../presentation/KeyboardView';
import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import sharedStyles from './Styles';
import { showErrorAlert } from '../utils/info';
import isValidEmail from '../utils/isValidEmail';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import StatusBar from '../containers/StatusBar';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";

class AccountUnlockView extends React.Component {
	static navigationOptions = ({ route }) => {
		const title = route.params?.title??'';
		return {
			title
		};
	}

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	state = {
		email: '',
		invalidEmail: true,
		isFetching: false
	}

	componentDidMount() {
		this.timeout = setTimeout(() => {
			this.emailInput.focus();
		}, 600);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { email, invalidEmail, isFetching } = this.state;
		const { theme } = this.props;
		if (nextProps.theme !== theme){
			return true;
		}
		if (nextState.email !== email) {
			return true;
		}
		if (nextState.invalidEmail !== invalidEmail) {
			return true;
		}
		if (nextState.isFetching !== isFetching) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	validate = (email) => {
		if (!isValidEmail(email)) {
			this.setState({ invalidEmail: true });
			return;
		}
		this.setState({ email, invalidEmail: false });
	}

	sendRegisterEmail = async() => {
		const { email, invalidEmail } = this.state;
		if (invalidEmail || !email) {
			return;
		}
		try {
			this.setState({ isFetching: true });
			const result = await RocketChat.sendRegisterEmail(email);
			if (result.success) {
				const { navigation } = this.props;
				navigation.popToTop();
				showErrorAlert(I18n.t('reset_account_completed'), I18n.t('Alert'));
			}
		} catch (e) {
			// const msg = (e.data && e.data.error) || I18n.t('There_was_an_error_while_action', I18n.t('Reset_Account'));
			showErrorAlert(I18n.t('reset_account_excluded_text'), I18n.t('Alert'));
		}
		this.setState({ isFetching: false });
	}

	render() {
		const { invalidEmail, isFetching } = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<Text style={[sharedStyles.loginTitle, sharedStyles.textBold]}>{I18n.t('Reset_Account')}</Text>
					<Text style={[sharedStyles.descriptionText]}>{I18n.t('reset_account_text')}</Text>
					<TextInput
						inputRef={(e) => { this.emailInput = e; }}
						placeholder={I18n.t('Email')}
						keyboardType='email-address'
						iconLeft='mail'
						returnKeyType='send'
						onChangeText={email => this.validate(email)}
						onSubmitEditing={this.sendRegisterEmail}
						testID='account-unlock-view-email'
						containerStyle={sharedStyles.inputLastChild}
						theme={theme}
					/>
					<View style={{ alignItems: 'center' }}>
						<Button
							title={I18n.t('Reset_Account')}
							type='done'
							size='Y'
							onPress={this.sendRegisterEmail}
							testID='account-unlock-view-submit'
							loading={isFetching}
							disabled={invalidEmail}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}

export default withTheme(AccountUnlockView);

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ScrollView
} from 'react-native';

import RocketChat from '../../lib/rocketchat';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import KeyboardView from '../../presentation/KeyboardView';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import TextInput from '../../containers/TextInput';
import Button from '../../containers/Button';
import isValidEmail from '../../utils/isValidEmail';
import { showToast } from '../../utils/info';
import {themes} from "../../constants/colors";


export default class EmailAddView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
			loading: false,
			email: '',
			isSending: false,
			invalidEmail: true
		};
	}

	validate = (email) => {
		if (!isValidEmail(email)) {
			this.setState({ invalidEmail: true });
			return;
		}
		this.setState({ email, invalidEmail: false });
	};

	invite = async() => {
		const { email, invalidEmail } = this.state;

		if (invalidEmail || !email) {
			return;
		}
		this.setState({ isSending: true });
		try {
			const result = await RocketChat.inviteWithMail(email);
			if (result.success) {
				showToast(I18n.t('Invite_With_Mail_Success'));
			}
			else{
				showToast(I18n.t('Invite_Failure'));
			}
		} catch (e) {
			showToast(I18n.t('Invite_Failure'));
		}

		this.setState({ isSending: false });
	};

	render = () => {
		const { invalidEmail, isSending } = this.state;
		const { theme } = this.props;

		return (
			<ScrollView key='EMail' {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
				<Text style={{ ...sharedStyles.loginTitle, ...sharedStyles.textBold, color: themes[theme].titleText }}>{I18n.t('Input_User_Email_Address')}</Text>
				<Text style={{ ...sharedStyles.descriptionText, color: themes[theme].bodyText }}>{I18n.t('Input_User_Email_Address_Text')}</Text>
				<TextInput
					inputRef={(e) => { this.emailInput = e; }}
					placeholder={I18n.t('Email')}
					keyboardType='email-address'
					iconLeft='mail'
					returnKeyType='send'
					onChangeText={email => this.validate(email)}
					onSubmitEditing={this.invite}
					testID='invite-view-email'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
				/>
				<View style={{ alignItems: 'center' }}>
					<Button
						title={I18n.t('Invite_Friend')}
						type='done'
						size='W'
						onPress={this.invite}
						testID='invite-view-submit'
						loading={isSending}
						disabled={invalidEmail}
						theme={theme}
					/>
				</View>
			</ScrollView>
		);
	};
}

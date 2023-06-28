import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, Keyboard
} from 'react-native';
import { connect } from 'react-redux';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import RocketChat from '../lib/rocketchat';
import { loginRequest as loginRequestAction } from '../actions/login';
import StatusBar from '../containers/StatusBar';
import { showToast } from '../utils/info';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";

const shouldUpdateState = ['password', 'password_confirm', 'saving'];

class ResetCardPasswordView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Secret_Mode')
	});

	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
			cardId: props.route.params?.cardId,
			password: '',
			password_confirm: '',
			saving: false,
			password_error: false,
			password_confirm_error: false
		};
	}

	componentDidMount() {
		// this.timeout = setTimeout(() => {
		// 	this.nameInput.focus();
		// }, 600);
	}

	shouldComponentUpdate(nextProps, nextState) {
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	// componentDidUpdate(prevProps) {
	// 	const { Site_Name } = this.props;
	// 	if (Site_Name && prevProps.Site_Name !== Site_Name) {
	// 		this.setTitle(Site_Name);
	// 	}
	// }

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	valid = () => {
		const {
			password, password_confirm
		} = this.state;
		return password.trim()
			&& password_confirm.trim()
			&& (password.trim().length >= 8)
			&& (password.trim() === password_confirm.trim());
	}

	submit = async() => {
		const {
			cardId, password, password_confirm
		} = this.state;
		if (!this.valid()) {
			if (!(password.trim() >= 8)) {
				this.setState({ password_error: true });
			}
			if (password.trim() === password_confirm.trim()) {
				this.setState({ password_confirm_error: true });
			}

			return;
		}
		this.setState({ saving: true });
		Keyboard.dismiss();

		const { navigation } = this.props;

		try {
			const req = await RocketChat.resetCardPassword(
				password, cardId
			);
			if(req.success){
				showToast(I18n.t('change_card_password_success'));
				navigation.goBack();
			}
		} catch (e) {
			showToast(I18n.t('change_card_password_failure'));
		}
		this.setState({ saving: false });
		this.setState({ password_error: false });
		this.setState({ password_confirm_error: false });
	}

	render() {
		const {
			saving, password_error, password_confirm_error
		} = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('resetting_password')}</Text>
					{password_error ? <Text style={{ color: 'red' }}>{I18n.t('error-invalid-password')}</Text> : null}
					<TextInput
						inputRef={(e) => { this.passwordInput = e; }}
						placeholder={I18n.t('New_Password')}
						returnKeyType='next'
						iconLeft={{vector: true, icon: 'lock-outline'}}
						secureTextEntry
						textContentType={'oneTimeCode'}
						onChangeText={value => this.setState({ password: value })}
						onSubmitEditing={() => { this.passwordConfirmInput.focus(); }}
						testID='reset-password-view-password'
						theme={theme}
					/>
					<Text style={{ marginVertical: 8, color: themes[theme].auxiliaryText }}>{I18n.t('Password_policy')}</Text>
					{password_confirm_error ? <Text style={{ marginVertical: 8, color: 'red' }}>{I18n.t('error-invalid-password-repeat')}</Text> : null}
					<TextInput
						inputRef={(e) => { this.passwordConfirmInput = e; }}
						placeholder={I18n.t('Repeat_Password')}
						returnKeyType='send'
						iconLeft={{vector: true, icon: 'lock-outline'}}
						secureTextEntry
						textContentType={'oneTimeCode'}
						onChangeText={value => this.setState({ password_confirm: value })}
						onSubmitEditing={this.submit}
						testID='reset-password-view-password-confirm'
						containerStyle={sharedStyles.inputLastChild}
						theme={theme}
					/>
					<View style={{alignItems: 'center'}}>
						<Button
							text={I18n.t('RESET')}
							type='done'
							size='Y'
							style={{alignItems: 'center'}}
							onPress={this.submit}
							disabled={!this.valid()}
							loading={saving}
							testID='reset-password-view-submit'
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapDispatchToProps =  dispatch => ({
	loginRequest: params => dispatch(loginRequestAction(params))
});

export default connect(null, mapDispatchToProps)(withTheme(ResetCardPasswordView));

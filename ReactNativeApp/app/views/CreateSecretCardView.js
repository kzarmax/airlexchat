import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, StyleSheet, View, Keyboard
} from 'react-native';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";


const shouldUpdateState = ['password', 'password_confirm', 'saving'];

const styles = StyleSheet.create({
	loginText: {
		fontSize: 16,
		marginVertical: 24,
		lineHeight: 24
	},
	textSize: {
		fontSize: 16
	},
	textLink: {
		...sharedStyles.link,
		fontSize: 16
	},
	headerText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black',
		textAlign: 'center'
	}
});

class CreateSecretCardView extends React.Component {
	static navigationOptions = () => ({
		headerTitle: () => <Text style={styles.headerText}>{I18n.t('Secret_Mode')}</Text>,
		headerLayoutPreset: 'center',
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const name = props.route.params?.name;
		this.state = {
			name: name,
			password: '',
			password_confirm: '',
			saving: false,
			password_error: false,
			password_confirm_error: false
		}
	}

	componentDidMount() {
	}

	shouldComponentUpdate(nextProps, nextState) {
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	componentWillUnmount() {

	}

	valid = () => {
		const {
			password, password_confirm
		} = this.state;
		return password.trim()
			&& password_confirm.trim()
			&& (password.trim().length >= 8)
			&& (password.trim().length <= 32)
			&& (password.trim() === password_confirm.trim());
	}

	submit = async() => {
		const {
			name, password, password_confirm
		} = this.state;
		if (!this.valid()) {
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


		navigation.navigate('CreateSecretCardCompleteView', {name: name, password: password});

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
			<KeyboardView contentContainerStyle={{ ...sharedStyles.container, color: themes[theme].backgroundColor }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<Text style={[styles.loginText, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Please_Input_Card_Password')}</Text>
					{password_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password')}</Text> : null}
					<TextInput
						inputRef={(e) => { this.passwordInput = e; }}
						placeholder={I18n.t('Password')}
						returnKeyType='next'
						// iconLeft='key'
						secureTextEntry
						textContentType={'oneTimeCode'}
						onChangeText={value => this.setState({ password: value })}
						onSubmitEditing={() => { this.passwordConfirmInput.focus(); }}
						testID='register-view-password'
						theme={theme}
					/>
					<Text>{I18n.t('Card_Password_policy')}</Text>
					{password_confirm_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password-repeat')}</Text> : null}
					<TextInput
						inputRef={(e) => { this.passwordConfirmInput = e; }}
						placeholder={I18n.t('Repeat_Password')}
						returnKeyType='send'
						// iconLeft='key'
						secureTextEntry
						textContentType={'oneTimeCode'}
						onChangeText={value => this.setState({ password_confirm: value })}
						onSubmitEditing={this.submit}
						testID='register-view-password-confirm'
						containerStyle={sharedStyles.inputLastChild}
						theme={theme}
					/>
					<View style={{ alignItems: 'center' }}>
						<Button
							text={I18n.t('Create_Card_Password')}
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
				</ScrollView>
			</KeyboardView>
		);
	}
}

export default withTheme(CreateSecretCardView);

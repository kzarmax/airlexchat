import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, StyleSheet, View, Alert, Keyboard
} from 'react-native';
import { connect } from 'react-redux';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import { showToast } from '../utils/info';
import { selectOne as selectOneAction } from '../actions/cards';
import RocketChat from '../lib/rocketchat';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";

const shouldUpdateState = ['password', 'passing', 'password_error'];

const styles = StyleSheet.create({
	loginText: {
		...sharedStyles.bottomText,
		marginVertical: 20,
		fontSize: 16
	},
	textSize: {
		fontSize: 16
	},
	textLink: {
		...sharedStyles.link,
		fontSize: 16
	}
});

class OpenSecretCardView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Secret_Mode')
	});

	static propTypes = {
		navigation: PropTypes.object,
		is_share_mode: PropTypes.bool,
		selectOneCard: PropTypes.func.isRequired,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const cardId = props.route.params.cardId;
		this.state = {
			cardId: cardId,
			password: '',
			passing: false,
			password_error: false,
		}
	}

	componentDidMount() {
	}

	shouldComponentUpdate(nextProps, nextState) {
		// eslint-disable-next-line react/destructuring-assignment
		const { theme } = this.props;
		if(nextProps.theme !== theme){
			return true;
		}
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	componentWillUnmount() {

	}

	valid = () => {
		const {
			password
		} = this.state;
		return password.trim()
			&& (password.trim().length >= 8)
			&& (password.trim().length <= 32)
	}

	submit = async() => {
		const {
			cardId, password
		} = this.state;
		if (!this.valid()) {
			if (!(password.trim().length >= 8)) {
				this.setState({ password_error: true });
			}
			if (!(password.trim().length <= 32)) {
				this.setState({ password_error: true });
			}

			return;
		}
		this.setState({ passing: true });
		Keyboard.dismiss();

		const { navigation, selectOneCard, is_share_mode } = this.props;

		try {
			//カード情報を作成する
			const req = await RocketChat.openSecretCard(cardId, password);

			if (req.success) {
				await selectOneCard({id: cardId, callback:()=>{
						showToast(I18n.t('change_card_true'));
						if(is_share_mode){
							navigation.navigate("ShareListView");
						} else {
							navigation.goBack();
						}
				}});
			}
		}catch (e) {
			showToast(I18n.t('invalid_secret_card_password'));
		}

		this.setState({ passing: false });
		this.setState({ password_error: false });
	}

	forgotPassword = () => {
		const { navigation } = this.props;
		const { cardId } = this.state;
		navigation.push('AccountVerifyView', { cardId: cardId });
	}

	render() {
		const { is_share_mode, theme } = this.props;
		const {
			passing, password_error
		} = this.state;
		return (
			<KeyboardView contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<Text style={[ styles.loginText, sharedStyles.textBold, {color: themes[theme].titleText }]}>{I18n.t('Please_Input_Card_Password')}</Text>
					{password_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password')}</Text> : null}
					<TextInput
						inputRef={(e) => { this.passwordInput = e; }}
						placeholder={I18n.t('Password')}
						returnKeyType='next'
						// iconLeft='key'
						secureTextEntry
						textContentType={'oneTimeCode'}
						onChangeText={value => this.setState({ password: value })}
						onSubmitEditing={this.submit}
						testID='register-view-password'
						theme={theme}
					/>
					<View style={{ alignItems: 'center' }}>
						<Button
							text={I18n.t('Open_Secret_Card')}
							type='done'
							size='Z'
							style={{ alignItems: 'center', marginTop: 15 }}
							onPress={this.submit}
							disabled={!this.valid()}
							loading={passing}
							testID='register-view-submit'
							theme={theme}
						/>
						{ is_share_mode ? null :
							<View style={ sharedStyles.bottomText }>
								<Text style={{ color: themes[theme].auxiliaryText }}>{ I18n.t('if_you_change_your_card_password') }</Text>
								<Text style={{ ...sharedStyles.link, color: themes[theme].auxiliaryText }}
									  onPress={ this.forgotPassword }>{ I18n.t('Here') }</Text>
							</View>
						}
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	is_share_mode: !!(state.share.server && state.share.server.server),
});

const mapDispatchToProps = dispatch => ({
	selectOneCard: params => dispatch(selectOneAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(OpenSecretCardView));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { WebView } from 'react-native-webview';
import Button from '../containers/Button';
import RocketChat from '../lib/rocketchat';
import sharedStyles from './Styles';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import UserPreferences from '../lib/userPreferences';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";
import CheckBox from "../containers/CheckBox";
import database from "../lib/database";
import {appStart as appStartAction, ROOT_FIRST_CARD} from "../actions/app";
import {DEFAULT_SERVER} from "../constants/servers";

const shouldUpdateState = ['agree', 'token', 'oauthToken'];

class AgreementView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func.isRequired,
		termsService: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
			agree: false,
			saving: false,
			token: props.route.params?.token
			// termsService: ''
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { termsService } = this.props;
		if (termsService !== nextProps.termsService) {
			return true;
		}
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	valid = () => {
		const { agree } = this.state;
		if (!agree) {
			return;
		}
		return agree;
	};

	submit = async() => {
		const { token } = this.state;
		const { appStart, user } = this.props;
		if (!this.valid()) {
			return;
		}

		this.setState({ saving: true });

		let _userId = user.id;
		let _loginToken = user.token;
		try {
			// email認証
			if (token) {
				const result = await RocketChat.emailVerification(token);
				if (result.userId && result.token) {
					await UserPreferences.setStringAsync(RocketChat.TOKEN_KEY, result.token);
					_userId = result.userId;
					_loginToken = result.token;
				}
			}

			// 同意
			await RocketChat.agreement(_userId, _loginToken);

			// Set User`s Agree in Storage
			const userId = await UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ DEFAULT_SERVER }`);
			const db = database.servers;
			const userCollection = db.collections.get('users');
			try {
				const userRecord = await userCollection.find(userId);
				await db.action(async() => {
					await userRecord.update((u) => {
						u.agree = true;
					});
				});
			} catch {
			}

			// ログイン --> 初回カード登録画面
			appStart({root: ROOT_FIRST_CARD});
		} catch (e) {
			Alert.alert(I18n.t('Oops'), e.data.error);
			log(e, 'Agreement Error');
		}
		this.setState({ saving: false });
	};

	cancel = () => {
		const { navigation } = this.props;
		navigation.navigate('OutsideStack');
	};

	toggleCheck = () => {
		const { agree } = this.state;
		this.setState({ agree: !agree });
	};

	render() {
		const { agree, saving } = this.state;
		const { termsService, theme } = this.props;
		return (
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }} testID='terms-view'>
				<StatusBar />
				 <Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Terms_of_Service')}</Text>
				<WebView style={[sharedStyles.containerScrollView]} originWhitelist={['*']} source={{ html: termsService, baseUrl: '' }} />
				<View style={{ alignItems: 'center' }}>
					<CheckBox
						title={I18n.t('I_agree_with_the_Terms_of_Service')}
						checked={agree}
						onPress={() => this.toggleCheck()}
						onIconPress={() => this.toggleCheck()}
						checkedColor='red'
						checkedIcon='check-square-o'
						uncheckedIcon='square-o'
						unCheckedColor={themes[theme].bodyText}
						textStyle={{ color: themes[theme].bodyText }}
						containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
					/>
					<Button
						text={I18n.t('Register')}
						type='done'
						size='Y'
						onPress={this.submit}
						disabled={!this.valid()}
						loading={saving}
						testID='agreement-view-submit'
						theme={theme}
					/>
					<Button
						text={I18n.t('Cancel')}
						type='secondary'
						size='Y'
						onPress={this.cancel}
						testID='agreement-view-cancel'
						theme={theme}
					/>
				</View>
			</View>
		);
	}
}


const mapStateToProps = state => ({
	termsService: state.settings.Layout_Terms_of_Service,
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
});

const mapDispatchToProps = dispatch => ({
	appStart: root => dispatch(appStartAction(root))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(AgreementView));

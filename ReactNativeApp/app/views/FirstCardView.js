import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, ScrollView, View, StyleSheet, Keyboard
} from 'react-native';
import { connect } from 'react-redux';

import TextInput from '../containers/TextInput';
import Button from '../containers/Button';
import StatusBar from '../containers/StatusBar';
import KeyboardView from '../presentation/KeyboardView';
import sharedStyles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import { setCards as setCardsAction } from '../actions/cards';
import RocketChat from '../lib/rocketchat';
import { verticalScale } from '../utils/scaling';
import Moment from 'moment';
import { showToast } from '../utils/info';
import UserPreferences from '../lib/userPreferences';
import { ROOT_INSIDE, appStart as appStartAction } from "../actions/app";
import {withTheme} from "../theme";
import {themes} from "../constants/colors";
import database from "../lib/database";
import {DEFAULT_SERVER} from "../constants/servers";

const shouldUpdateState = ['name', 'saving'];

const styles = StyleSheet.create({
	description: {
		marginTop: verticalScale(10),
		fontSize: 16,
		lineHeight: 20,
		textAlign: 'center'
	},
	btn_submit: {
		marginTop: verticalScale(20),
		alignItems: 'center'
	},
	adhocText: {
		marginBottom: 30
	}
});

class FirstCardView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		loginRequest: PropTypes.func,
		userId: PropTypes.string,
		appStart: PropTypes.func,
		setCards: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			name: '',
			saving: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		// eslint-disable-next-line react/destructuring-assignment
		return shouldUpdateState.some(key => nextState[key] !== this.state[key]);
	}

	valid = () => {
		const {
			name
		} = this.state;

		return name.trim();
	};

	submit = async() => {
		if (!this.valid()) {
			return;
		}

		Keyboard.dismiss();

		const { name } = this.state;
		const { setCards, appStart } = this.props;
		let date = new Date();
		try {
			this.setState({ saving: true });
			//カード情報を作成する
			const req = await RocketChat.createCard({
				name: Moment(date).format('YYYY.MM.DD'),// TODO: タイムスタンプを入れる
				username: name,
				active: true // カードを選択する
			});

			if (req.success) {
				// カード情報をセットする
				setCards(req.cards);

				// Set User`s CardCreated in Storage
				const userId = await UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ DEFAULT_SERVER }`);
				const db = database.servers;
				const userCollection = db.collections.get('users');
				try {
					const userRecord = await userCollection.find(userId);
					await db.action(async() => {
						await userRecord.update((u) => {
							u.cardCreated = true;
						});
					});
				} catch {
				}
				//E-9 友達登録画面
				appStart({root: ROOT_INSIDE});
			} else {
				showToast(I18n.t('Creating_Card_Failed'));
			}
		} catch (e) {
			showToast(I18n.t('Creating_Card_Failed'));
		}
		this.setState({ saving: false });
	};

	render() {
		const { saving } = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}>
				<StatusBar />
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('The_name_to_display')}</Text>
					<TextInput
						label={I18n.t('Create_first_friend_desc')}
						placeholder={I18n.t('Please_enter_display_name')}
						returnKeyType='done'
						onChangeText={value => this.setState({ name: value })}
						onSubmitEditing={this.submit}
						theme={theme}
					/>
					<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('Create_first_friend_notice')}</Text>
					<View style={styles.btn_submit}>
						<Button
							text={I18n.t('Immediately_register_friends')}
							type='done'
							size='T'
							onPress={this.submit}
							disabled={!this.valid()}
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
	userId: state.login.user && state.login.user.id
});

const mapDispatchToProps = dispatch => ({
	setCards: cards => dispatch(setCardsAction(cards)),
	appStart: root => dispatch(appStartAction(root))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(FirstCardView));

import React from 'react';
import PropTypes from 'prop-types';
import {
	Text, View, StyleSheet
} from 'react-native';
import { connect } from 'react-redux';

import Button from '../containers/Button';
import sharedStyles from './Styles';
import I18n from '../i18n';
import StatusBar from '../containers/StatusBar';
import RocketChat from '../lib/rocketchat';
import Moment from 'moment';
import { setCards as setCardsAction } from '../actions/cards';
import { appStart as appStartAction } from '../actions/app';
import { showToast } from '../utils/info';
import {ROOT_INSIDE} from "../actions/app";
import {withTheme} from "../theme";
import {themes} from "../constants/colors";

const styles = StyleSheet.create({
	loginTitle: {
		marginVertical: 0,
		marginTop: 15
	},
	headerText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: 'black',
		textAlign: 'center'
	}
});

class CreateSecretCardCompleteView extends React.Component {
	static navigationOptions = ({}) => ({
		headerTitle: () => <Text style={styles.headerText}>{I18n.t('Secret_Mode')}</Text>,
		headerLayoutPreset: 'center',
	})

	static propTypes = {
		navigation: PropTypes.object,
		appStart: PropTypes.func,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const name = props.route.params?.name;
		const password = props.route.params?.password;
		this.state ={
			isSaving: false,
			name: name,
			password: password
		}
	}

	componentDidMount() {
	}

	shouldComponentUpdate(nextProps, nextState) {
	}

	componentWillUnmount() {
	}

	submit = async () => {
		const { name, password } = this.state;
		const { setCards, appStart } = this.props;
		this.setState({ isSaving: true });

		try {
			//カード情報を作成する
			const req = await RocketChat.createCard({
				name: Moment().format('YYYY.MM.DD'),// TODO: タイムスタンプを入れる
				username: name,
				password: password,
				active: true // カードを選択する
			});

			if (req.success) {
				// カード情報をセットする
				setCards(req.cards);
			}

			//E-9 友達登録画面
			appStart({root: ROOT_INSIDE});
			//Navigation.navigate('FriendAddView');
		}catch (e) {
			showToast(I18n.t('Creating_Secret_Card_Failed'));
			this.setState({ isSaving: false });
		}
	};

	render() {
		const { isSaving } = this.state;
		const { theme } = this.props;
		return (
			<View
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				key='creat-secret-card-view'
			>
				<StatusBar />
				<View style={{ alignItems: 'center' }}>
				<Text style={[sharedStyles.loginTitle, sharedStyles.textBold, { color: themes[theme].titleText }]}>{I18n.t('Create_Secret_Password_Complete')}</Text>
				<Button
					title={I18n.t('Create_Secret_Card')}
					type='done'
					size='Z'
					style={{ alignItems: 'center', marginTop: 15 }}
					onPress={this.submit}
					testID='creat-secret-card-view-submit'
					loading={isSaving}
					theme={theme}
				/>
				</View>
			</View>
		);
	}
}

const mapDispatchToProps = (dispatch) => ({
	setCards: cards => dispatch(setCardsAction(cards)),
	appStart: root => dispatch(appStartAction(root))
});
export default connect(null, mapDispatchToProps)(withTheme(CreateSecretCardCompleteView));
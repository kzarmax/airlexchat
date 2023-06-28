import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, SafeAreaView } from 'react-native';
import { connect } from 'react-redux';
import Swiper from 'react-native-swiper';

import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { selectOne as selectOneAction } from '../../actions/cards';
import Avatar from '../../containers/Avatar';
import { CloseButtonGoQR } from '../../containers/HeaderButton';

import styles from './styles';

import Button from '../../containers/Button';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import { showToast } from '../../utils/info';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class QRCardSelectView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseButtonGoQR navigation={navigation} testID='qr-after-select-view' />,
		title: I18n.t('FriendsAddView')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		cards: PropTypes.array,
		selected: PropTypes.object,
		navigation: PropTypes.object,
		selectOneCard: PropTypes.func.isRequired,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		const { friendCard } = props.route.params;
		this.state = {
			friendCard,
			selected: 0,
			saving: false,
			renderCards: this.renderCards()
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { renderCards } = this.state;
		const { theme } = this.props;
		if (nextState.renderCards !== renderCards) {
			return true;
		}
		return nextProps.theme !== theme;
	}

	componentDidUpdate(prevProps) {
		const {
			cards
		} = this.props;

		if (!(prevProps.cards === cards)) {
			this.setTimer();
		}
	}

	// カード切り替え処理
	selectCards = async(card) => {
		const { navigation, selectOneCard, selected } = this.props;

		if(selected._id !== card._id){
			if(card.isSecret)
				navigation.navigate('OpenSecretCardView', {cardId: card._id});
			else
				selectOneCard({id:card._id, callback:()=>{}});
		}
	};

	// カード一覧の描画
	renderCards = () => {
		const { cards, theme } = this.props;
		const {
			baseUrl, user
		} = this.props;
		const rows = [];

		if (cards.length) {
			for (let i = 0; i < cards.length; i += 1) {
				if (cards[i].name) {
					rows.push(
						<View style={styles.selectCard} key={`qr-card-select-view-key-${ i }`}>
							<View style={styles.avatarContainer}>
								<Avatar
									key='qr-card-select-image'
									borderRadius={10}
									type='ci'
									text={cards[i]._id}
									size={80}
								/>
								<View style={styles.avatarSide}>
									<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('select_card')}</Text>
									<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{cards[i].name}</Text>
								</View>
							</View>
							<Avatar
								key='qr-card-select-avatar'
								borderRadius={40}
								type='ca'
								text={cards[i]._id}
								size={80}
							/>

							<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{cards[i].username}</Text>
							<Text style={{ ...styles.cardMessage, color: themes[theme].auxiliaryText }}>{cards[i].comment}</Text>
						</View>
					);
				}
			}
		}
		return rows;
	}

	// つながる処理
	friendAdd = async() => {
		const { cards } = this.props;
		const { friendCard, selected } = this.state;

		// 選択したカード情報をセット
		const card = cards[selected];

		// 友達追加情報をセット
		const params = {
			cardId: card._id,
			friendCardId: friendCard.card._id
		};

		this.setState({ saving: true });

		try {
			// 友達追加
			const req = await RocketChat.createFriend(params);

			if (req.success) {
				// ルーム作成
				const result = await RocketChat.createDirectMessage(card._id, friendCard.card._id);
				if (result.success) {
					// カード選択状態を繫がったカードに切り替える
					this.selectCards(card);
					// 成功メッセージ
					showToast(I18n.t('friend_add_true'));
				}
				// 画面遷移
				const { navigation } = this.props;
				navigation.navigate('QRAfterAddView', { friendCard, cardId: card._id });
			}
		} catch (e) {
			log( e);
			this.setState({ saving: false });
		}
	}

	// 選択したカード
	selectCard = (index) => {
		this.setState({
			selected: index
		});
	}

	render() {
		const {
			saving, renderCards
		} = this.state;
		const { theme } = this.props;

		return (
			<SafeAreaView style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}>
				<View style={styles.textCenter}>
					<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('QRCardSelectText1')}</Text>
					<Text style={{ color: themes[theme].auxiliaryText }}>{I18n.t('QRCardSelectText2')}</Text>
				</View>
				<Swiper
					showsButtons
					style={styles.swiperArea}
					onIndexChanged={index => this.selectCard(index)}
					loop={false}
					paginationStyle={{ position: 'absolute', bottom: 60 }}
				>
					{renderCards}
				</Swiper>
				<View style={styles.btnArea}>
					<Button
						testID='sidebar-toggle-status'
						type='primary'
						text={I18n.t('friend_add')}
						size='w'
						onPress={() => this.friendAdd()}
						loading={saving}
						theme={theme}
					/>
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		customFields: state.login.user && state.login.user.customFields,
		emails: state.login.user && state.login.user.emails,
		token: state.login.user && state.login.user.token
	},
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	selectOneCard: params => dispatch(selectOneAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(QRCardSelectView));

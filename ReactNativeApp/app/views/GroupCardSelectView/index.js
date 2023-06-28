import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';
import { connect } from 'react-redux';
import Swiper from 'react-native-swiper';

import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import Avatar from '../../containers/Avatar';

import styles from './styles';

import Button from '../../containers/Button';
import { withTheme } from "../../theme";
import { themes } from "../../constants/colors";

class GroupCardSelectView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Create_Group')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		cards: PropTypes.array,
		navigation: PropTypes.object,
		theme : PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			selected: 0,
			saving: false,
			renderCards: this.renderCards(),
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { renderCards } = this.state;
		if (nextState.renderCards !== renderCards) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {

	}

	// カード一覧の描画
	renderCards = () => {
		const { cards, theme } = this.props;
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
									<Text style={{ ...styles.cardName, color: themes[theme].auxiliaryText }} ellipsizeMode={'tail'} numberOfLines={2}>{cards[i].name}</Text>
								</View>
							</View>
							<Avatar
								key='qr-card-select-avatar'
								borderRadius={40}
								type='ca'
								text={cards[i]._id}
								size={80}
							/>
							<Text style={{ ...styles.cardName, color: themes[theme].auxiliaryText }} ellipsizeMode={'tail'} numberOfLines={2}>{cards[i].username}</Text>
							<Text style={{ ...styles.cardMessage, color: themes[theme].auxiliaryText }} ellipsizeMode={'tail'} numberOfLines={2}>{cards[i].comment}</Text>
						</View>
					);
				}
			}
		}
		return rows;
	}

	// つながる処理
	friendAdd = () => {
		const { cards } = this.props;
		const { selected } = this.state;

		// 選択したカード情報をセット
		const card = cards[selected];

		this.setState({ saving: true });
		const { navigation } = this.props;
		navigation.navigate('CreateGroupView', { selected, cardId: card._id });
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
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor}} testID='qr-card_select-swipe'>
				<View style={styles.textCenter}>
					<Text style={{ color: themes[theme].bodyText }}>{I18n.t('GroupCardSelectText1')}</Text>
					<Text style={{ color: themes[theme].bodyText }}>{I18n.t('GroupCardSelectText2')}</Text>
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
						text={I18n.t('creating_group')}
						size='w'
						onPress={() => this.friendAdd()}
						loading={saving}
						theme={theme}
					/>
				</View>
			</View>
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
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(GroupCardSelectView));

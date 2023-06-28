import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, ScrollView, ActivityIndicator
} from 'react-native';

import RocketChat from '../../lib/rocketchat';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import SearchBox from '../../containers/SearchBox';
import debounce from '../../utils/debounce';
import log from '../../utils/log';
import { themes } from '../../constants/colors';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import Button from '../../containers/Button';
import { showToast } from '../../utils/info';
import Avatar from '../../containers/Avatar';
import moment from 'moment';

export default class IdAddView extends React.Component {

	static propTypes = {
		navigation: PropTypes.object,
		selected: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
			cardData: null,
			loading: false,
			text: '',
			globalUsers: true,
			isSending: false,
		};
	}

	onSearchChangeText = (text) => {
		this.setState({ text: text.trim(), cardData: null, loading: false });
	};

	// eslint-disable-next-line react/sort-comp
	load = debounce(async({ newSearch = false }) => {
		const {
			loading, text
		} = this.state;

		if (loading) {
			return;
		}

		if (newSearch) {
			this.setState({ cardData: null, loading: false });
			if(text.length === 0)
				return;
		}

		this.setState({ loading: true });

		try {

			const result = await RocketChat.getCardDetail(text);

			if (result.success) {
				this.setState({
					cardData: result.card,
					loading: false,
				});
			} else {
				this.setState({ cardData:{}, loading: false });
			}
		} catch (e) {
			log(e);
			this.setState({ cardData:{}, loading: false });
		}
	}, 200);

	search = () => {
		this.load({ newSearch: true });
	};

	invite = async() => {
		const { cardData,  } = this.state;
		const { selected } = this.props;
		if(!cardData)
			return;
		this.setState({ isSending: true });
		try {
			// 友達追加情報をセット
			const params = {
				cardId: selected._id,
				friendCardId: cardData._id
			};

			// 友達追加
			const req = await RocketChat.createFriend(params);

			if (req.success) {
				// ルーム作成
				const result = await RocketChat.createDirectMessage(selected._id, cardData._id);
				if (result.success) {
					// 成功メッセージ
					showToast(I18n.t('friend_add_true'));
				}
				// 画面遷移
			}
			else{
				showToast(I18n.t('Invite_Failure'));
			}
		} catch (e) {
			showToast(I18n.t('Invite_Failure'));
		}
		this.setState({ isSending: false });
	};

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[sharedStyles.separator, styles.separator, { backgroundColor: themes[theme].separatorColor }]} />;
	};

	renderCardData = () => {
		const { cardData, isSending, loading, text } = this.state;
		const { baseUrl, theme } = this.props;

		if(loading)
			return (
				<View style={{ flex: 1 }}>
					<ActivityIndicator theme={theme} />
				</View>
			);

		if(!cardData || !cardData._id)
			return (
				<View style={{ ...styles.selectCard, backgroundColor: themes[theme].backgroundColor }}>
					<Text style={{ color: themes[theme].bodyText }}>{cardData && !cardData._id?I18n.t('Not_Exist_Card'):I18n.t('Please_Input_CardID')}</Text>
				</View>);

		const updatedAt = moment(cardData._updatedAt).format('YYYYMMDDhhmmss');
		console.log('renderCardData', updatedAt);
		return (
			<View key='ID' style={{ backgroundColor: themes[theme].backgroundColor, height: '100%' }}>
				<ScrollView
					{...scrollPersistTaps}
					contentContainerStyle={ styles.cardDataContainer }
				>
					<View style={styles.selectCard} key={`card-detail-view-key`}>
						<View style={styles.avatarContainer}>
							<Avatar
								key='qr-card-select-avatar'
								borderRadius={40}
								type='ca'
								text={cardData._id}
								size={80}
							/>
							<View style={styles.avatarSide}>
								<Text style={{ ...styles.cardName, color: themes[theme].bodyText }} >{cardData.username}</Text>
								<Text style={{ ...styles.cardMessage, color: themes[theme].auxiliaryText }}>{cardData.comment}</Text>
							</View>
						</View>
					</View>
					<View style={styles.inviteBtn}>
						<Button
							title={I18n.t('Invite_Friend')}
							type='done'
							size='W'
							onPress={this.invite}
							testID='invite-view-submit'
							loading={isSending}
							theme={theme}
							/>
					</View>
				</ScrollView>
			</View>
		);
	};

	render = () => {
		const { theme } = this.props;
		return (
			<View
				key='ID'
				style={{ flex:1 }}
			>
				<SearchBox
					onChangeText={this.onSearchChangeText}
					onSubmitEditing={this.search}
					testID='federation-view-search'
					placeholder={ I18n.t('Input_CardID')}
				/>
				{ this.renderCardData()}
			</View>
		);
	}
}


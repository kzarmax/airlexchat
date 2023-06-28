import React from 'react';
import PropTypes from 'prop-types';
import {
	View, ScrollView, Text
} from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';

import { showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import log from '../../utils/log';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Avatar from '../../containers/Avatar';
import StatusBar from '../../containers/StatusBar';
import { setUser as setUserAction } from '../../actions/login';
import { withTheme } from '../../theme';
import {themes} from "../../constants/colors";

class OthersProfileView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Profile')
	}

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		navigation: PropTypes.object,
		room: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
		this.room = props.route.params?.room;
		this.cardId = props.route.params?.cardId;

		this.state = {
			room: this.room,
			friendCard: null,
			memo: '',
			friendInfo: null
		};

		this.init(this.rid, this.cardId);
	}

	init = async(rid, id) => {
		const { navigation } = this.props;
		let friend = [];
		let friendCard = [];
		let friendInfo = [];

		try {
			// チャットメンバー情報取得
			const roomMember = await RocketChat.getRoomMembers(rid, id, true);

			if (roomMember.total === 2) {
				// 自分のカード情報ではない情報を取得
				friend = roomMember.records.find(m => m._id !== id);

				// 友達のカード詳細情報を取得
				friendCard = await RocketChat.getCardInfo(friend._id);

				if (friendCard.success) {
					// 自分と友達の友達情報を取得
					// friendInfo = await RocketChat.getFriendInfo(id, null, friendCard.card._id);
					const friendList = await RocketChat.getCardFriends(id);
					friendInfo = friendList.friends.find(f => f.friendCardId === friend._id);
				}
			} else {
				showToast(I18n.t('error-profile-view'));
				navigation.navigate('RoomsListView');
			}
		} catch (error) {
			log(error);
			showToast(I18n.t('error-profile-view'));
			navigation.navigate('RoomsListView');
		}

		this.setState({
			friendCard,
			friendInfo,
			memo: friendInfo.memo
		});
	}

	// ブロック確認画面へ遷移
	blockAction = () => {
		const { navigation } = this.props;
		const { friendCard, friendInfo } = this.state;
		const params = {
			rid: this.rid,
			friendCard,
			friendInfo,
			room: this.room
		};
		navigation.navigate('OthersProfileBlockView', params);
	}

	// 削除確認画面へ遷移
	deleteAction = () => {
		const { navigation } = this.props;
		const { friendCard, friendInfo } = this.state;
		const params = {
			friendCard,
			friendInfo,
			room: this.room
		};
		navigation.navigate('OthersProfileDeleteView', params);
	}

	// シーンの詳細項目を表示
	sceneRender = () => {
		const { friendCard } = this.state;
		const rows = [];

		friendCard.card.profiles.forEach((p) => {
			if (p.public) {
				rows.push(
					<View style={styles.sceneArea} key={`other-profile-view-key-${ p.name }`}>
						<Text style={styles.sceneName}>{p.name}</Text>
						<Text style={styles.sceneValue}>{p.value}</Text>
					</View>
				);
			}
		});

		return rows;
	}

	// メモを保存する
	saveMemo = async() => {
		const { friendInfo, memo } = this.state;
		const friendId = friendInfo._id;
		const params = {
			friendId,
			memo
		};

		try {
			const result = await RocketChat.updateFriend(params);
			if (result.success) {
				showToast(I18n.t('friend_memo_saved'));
			}
		} catch (e) {
			log(e);
		}
	}

	render() {
		const {
			friendCard, memo, room
		} = this.state;
		const { theme } = this.props;

		if (friendCard && friendCard.card) {
			const block = room.blocker;
			return (
				<KeyboardView
					contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
					keyboardVerticalOffset={128}
				>
					<StatusBar />
					<ScrollView
						contentContainerStyle={sharedStyles.containerScrollView}
						testID='profile-view-list'
					>
						<View style={styles.textCenter}>
							<Avatar
								key='qr-after-read-card-avatar'
								borderRadius={40}
								type='ca'
								text={friendCard.card._id}
								size={80}
							/>
							<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{friendCard.card.username}</Text>
						</View>
						<View style={styles.commentArea}>
							<Text style={{ ...styles.comment, color: themes[theme].auxiliaryText }}>{I18n.t('profile_comment')}</Text>
							<Text style={{ ...styles.commentValue, color: themes[theme].bodyText }}>{friendCard.card.comment}</Text>
						</View>
						<View style={styles.btnBox} testID='others-profile-btnBox'>
							<Button
								testID='sidebar-toggle-status'
								type='done'
								text={!block ? I18n.t('Block_Btn') : I18n.t('Block_Off')}
								size='U'
								onPress={() => this.blockAction()}
								backgroundColor={!block ? '#C4CFD5' : '#66A9DD'}
								style={styles.blockBtn}
								theme={theme}
							/>
							<Button
								testID='sidebar-toggle-status'
								type='done'
								text={I18n.t('Delete')}
								size='U'
								onPress={() => this.deleteAction()}
								backgroundColor='#F95522'
								style={styles.deleteBtn}
								theme={theme}
							/>
						</View>
						<RCTextInput
							inputRef={(e) => { this.name = e; }}
							label={I18n.t('Memo')}
							onChangeText={value => this.setState({ memo: value })}
							testID='qr-after-add-memo'
							value={memo}
							theme={theme}
						/>
						{this.sceneRender()}
						<View style={styles.btnArea}>
							<Button
								testID='sidebar-toggle-status'
								type='primary'
								text={I18n.t('friend_memo_save')}
								size='w'
								onPress={() => this.saveMemo()}
								theme={theme}
							/>
						</View>
					</ScrollView>
				</KeyboardView>
			);
		} else {
			return (<View />);
		}
	}
}

// カードのプロフィール情報
const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	cards: state.cards && state.cards.cards,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(OthersProfileView))

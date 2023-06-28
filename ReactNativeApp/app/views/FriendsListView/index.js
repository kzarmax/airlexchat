import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, ActivityIndicator, Text, LayoutAnimation, SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';
import { orderBy } from 'lodash';

import Avatar from '../../containers/Avatar';
import { Q } from '@nozbe/watermelondb';
import database from '../../lib/database';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';
import styles from './styles';
import I18n from '../../i18n';
import { isIOS } from '../../utils/deviceInfo';
import Orientation from 'react-native-orientation-locker';
import { withTheme } from '../../theme';
import {themes} from "../../constants/colors";
import StatusBar from '../../containers/StatusBar';
import {MAX_SIDEBAR_WIDTH} from "../../constants/tablet";
import {getUserSelector} from "../../selectors/login";
import {withDimensions} from "../../dimensions";
import RocketChat from "../../lib/rocketchat";
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;
const filterFriends = s => s.archived !== true && s.open === true && s.t === 'd';
const filterGroup = s => s.archived !== true && s.open === true && s.t !== 'd';

class FriendsListView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('friend_list')
	})

	_isMounted = false;

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		baseUrl: PropTypes.string,
		server: PropTypes.string,
		cards: PropTypes.array,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		useRealName: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		width: PropTypes.number,
		theme: PropTypes.string
	}

	// Reactのライフサイクル constructor 最初に読まれる
	constructor(props) {
		super(props);

		this.gotSubscriptions = false;
		this.selectAllData = [];
		this.data = [];
		this.state = {
			loading: true,
			friend: [],
			group: []
		};
	}

	// Reactのライフサイクル マウントされる時に１度だけ実行される
	componentDidMount() {
		this._isMounted = true;
		this.getSubscriptions();
	}

	// Reactのライフサイクル 新しいpropsを受け取ると実行される
	componentDidUpdate(prevProps) {
		const {
			cards, selected, selectAll
		} = this.props;

		Orientation.unlockAllOrientations();

		if (!(
			(prevProps.cards === cards)
			&& (prevProps.selected._id === selected._id)
			&& (prevProps.selectAll === selectAll)
		)) {
			this.getSubscriptions(true);
		}
		// removed for now... we may not need it anymore
		// else if (appState === 'foreground' && appState !== prevProps.appState) {
		// 	// roomsRequest();
		// }
	}

	// unmount時に呼ばれる 終了処理等を記載する
	componentWillUnmount() {
		this._isMounted = false;
		if (this.getSubscriptions && this.getSubscriptions.stop) {
			this.getSubscriptions.stop();
		}
		if (this.updateState && this.updateState.stop) {
			this.updateState.stop();
		}
	}

	getName(cardId) {
		const { cards } = this.props;
		const target = cards.find(card => (card._id === cardId));
		return target.name;
	}

	getRoomTitle = item => RocketChat.getRoomTitle(item)

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	isGroupChat = item => RocketChat.isGroupChat(item)

	isRead = item => RocketChat.isRead(item)

	getUserPresence = uid => RocketChat.getUserPresence(uid)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room);

	// 全ての値をStateにセットする
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	// データ取得・整形部分の処理
	getSubscriptions = async(force = false) => {
		if (this.gotSubscriptions && !force) {
			return;
		}
		this.gotSubscriptions = true;

		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}

		this.setState({ loading: true });

		const {
			selected, server, selectAll
		} = this.props;

		// サーバに接続できるか
		const db = database.active;
		if (server && this.hasActiveDB()) {
			let observable;
			if(selected && !selectAll) {
				observable = await db.collections
					.get('subscriptions')
					.query(
						Q.where('archived', false),
						Q.where('open', true),
						Q.where('cardId',selected._id))
					.observeWithColumns(['room_updated_at', 'unread', 'alert', 'user_mentions', 'f', 't', 'users_count']);
			}
			else{
				observable = await db.collections
					.get('subscriptions')
					.query(
						Q.where('archived', false),
						Q.where('open', true)
					)
					.observeWithColumns(['room_updated_at', 'unread', 'alert', 'user_mentions', 'f', 't', 'users_count']);
			}

			this.querySubscription = observable.subscribe((data) => {

				this.data = orderBy(data, ['lastMessage.ts'], ['desc']);

				if(selectAll) {
					// invisible Secret Card Subscriptions
					const { cards } = this.props;
					const noSecretCards = cards.filter(card => !card.isSecret);
					const noSecretCardIds = noSecretCards.map(card => card._id);
					this.data = this.data.filter(item => noSecretCardIds.find(id => id === item.c._id));
				}

				// 友達のみ取得する
				this.friend = this.data.filter(s => filterFriends(s));

				// グループのみ取得する 正確には友達以外
				this.group = this.data.filter(s => filterGroup(s));

				// 値をセットする
				this.internalSetState({
					friend: this.friend,
					group: this.group,
					loading: false
				});

			});
		}
	};

	// 処理を終了
	removeListener = (data) => {
		if (data && data.removeAllListeners) {
			data.removeAllListeners();
		}
	};

	// DB接続
	// this is necessary during development (enables Cmd + r)
	hasActiveDB = () => database && database.active;

	// リストがない場合
	_isUnread = item => item.unread > 0 || item.alert;

	// リストをクリック時の画面遷移
	goRoom = ({ rid, name, t }) => {
		const { navigation } = this.props;
		navigation.navigate('RoomView', { rid, name, t });
	};

	// リストをクリック時のアクション
	onPressItem = (item = {}) => {
		const { navigation } = this.props;
		const { rid, cardId } = item;

		if (item.t === 'd') {
			// プロフィール
			navigation.navigate('OthersProfileView', { rid, cardId, room: item });
		} else {
			// グループプロフィール
			navigation.navigate('RoomInfoView', { rid, cardId, room: item });
		}
	}

	// ヘッダーテキスト部分
	friendText = () => {
		const { theme } = this.props;
		return (
			<View style={{ ...styles.friendBar, backgroundColor: themes[theme].auxiliaryBackground }}>
				<Text style={{ ...styles.friendBarText, color: themes[theme].auxiliaryText }}>{I18n.t('friend_list')}</Text>
			</View>
		);
	};

	friendEmptyText = () => {
		const { theme } = this.props;
		return (
			<View style={{ ...styles.friendEmptyBar, backgroundColor: themes[theme].auxiliaryBackground }}>
				<Text style={{ ...styles.friendBarText, color: themes[theme].auxiliaryText }}>{I18n.t('No_friends')}</Text>
			</View>
		);
	};

	// ヘッダーテキスト部分
	groupText = () => {
		const { theme } = this.props;
		return (
			<View style={{ ...styles.friendBar, backgroundColor: themes[theme].auxiliaryBackground }}>
				<Text style={{ ...styles.friendBarText, color: themes[theme].auxiliaryText }}>{I18n.t('group_list')}</Text>
			</View>
		);
	};

	groupEmptyText = () => {
		const { theme } = this.props;
		return (
			<View style={{ ...styles.friendEmptyBar, backgroundColor: themes[theme].auxiliaryBackground }}>
				<Text style={{ ...styles.friendBarText, color: themes[theme].auxiliaryText }}>{I18n.t('No_groups')}</Text>
			</View>
		);
	};

	// 1項目の表示内容設定
	renderItem = ({ item }) => {
		if(item.isHeader){
			if(item.type === 'd'){
				return item.count ? this.friendText() : this.friendEmptyText();
			} else {
				return item.count ? this.groupText() : this.groupEmptyText();
			}
		}
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width
		} = this.props;
		const id = this.getUidDirectMessage(item);
		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				username={username}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				testID={`friends-list-view-item-${ item.name }`}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				swipeEnabled={false}
				useRealName={useRealName}
				getUserPresence={this.getUserPresence}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				getIsGroupChat={this.isGroupChat}
				getIsRead={this.isRead}
				visitor={item.visitor}
				isFocused={false}
			/>
		);
	};

	renderSeparator = () => <View style={styles.separator} />

	// フレンド一覧
	renderScrollFriends = () => (this.renderScroll('d'));

	// グループ一覧
	renderScrollGroup = () => (this.renderScroll());

	getScrollRef = ref => this.scroll = ref

	// 一覧表示
	renderScroll = () => {
		const { loading, friend, group } = this.state;
		const { theme } = this.props;

		// 友達かグループかの判定
		let view_data = [{ isHeader: true, rid: 'friend_header', type: 'd', count: friend.length }, ...friend, { isHeader: true, rid: 'group_header', type: 'd', count: group.length }, ...group ];

		if (loading) {
			return <ActivityIndicator style={{ ...styles.loading, color: themes[theme].bodyText }} />;
		}

		return (
			<FlatList
				ref={this.getScrollRef}
				data={view_data}
				extraData={view_data}
				keyExtractor={keyExtractor}
				style={{ ...styles.list, backgroundColor: themes[theme].backgroundColor }}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				getItemLayout={getItemLayout}
				enableEmptySections
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
				initialNumToRender={12}
				windowSize={7}
			/>
		);
	}

	// カードアバター表示
	renderCardAvatar = () => {
		const {
			selected, selectAll, theme
		} = this.props;

		if (!(selectAll)) {
			return (
				<View style={{ ...styles.avatarContainer, backgroundColor: themes[theme].avatarBackground }} testID='friends-list-view-avatar'>
					<Avatar
						key='friends-list-header-avatar'
						style={styles.avatarImage}
						borderRadius={40}
						type='ca'
						text={selected._id}
						size={60}
					/>
					<View style={styles.avatarSide}>
						<Text style={{ ...styles.avatarNameText, color: themes[theme].titleText }} ellipsizeMode={'tail'} numberOfLines={1}>{selected.username}</Text>
						<Text style={{ ...styles.avatarCommentText, color: themes[theme].auxiliaryText }} ellipsizeMode={'tail'} numberOfLines={1}>{selected.comment}</Text>
					</View>
				</View>
			);
		}

		return null;
	}

	render = () => {
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='friends-list-view'>
				<StatusBar/>
				{this.renderCardAvatar()}
				{this.renderScroll()}
			</SafeAreaView>
		);
	}
}


const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	setUser: PropTypes.func,
	server: state.server.server,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	sortBy: state.sortPreferences.sortBy,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	useRealName: state.settings.UI_Use_Real_Name,
	StoreLastMessage: state.settings.Store_Last_Message
});

const mapDispatchToProps = dispatch => ({});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(FriendsListView)));

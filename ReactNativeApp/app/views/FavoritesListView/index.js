import React from 'react';
import PropTypes from 'prop-types';
import {
	View, FlatList, ActivityIndicator, LayoutAnimation, SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';

import database from '../../lib/database';

import RocketChat from '../../lib/rocketchat';
import RoomItem, { ROW_HEIGHT }  from '../../presentation/RoomItem';
import styles from './styles';
import log from '../../utils/log';
import I18n from '../../i18n';
import { isIOS } from '../../utils/deviceInfo';
import { Q } from '@nozbe/watermelondb';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import {MAX_SIDEBAR_WIDTH} from "../../constants/tablet";
import {withDimensions} from "../../dimensions";
import {getUserSelector} from "../../selectors/login";
import {goRoom} from "../../utils/goRoom";

const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

class FavoritesListView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Starred')
	});

	_isMounted = false;

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		cards: PropTypes.array,
		isMasterDetail: PropTypes.bool,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		baseUrl: PropTypes.string,
		server: PropTypes.string,
		loadingServer: PropTypes.bool,
		groupByType: PropTypes.bool,
		showFavorites: PropTypes.bool,
		showUnread: PropTypes.bool,
		useRealName: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		width: PropTypes.number,
		theme: PropTypes.string
	}

	// Reactのライフサイクル constructor 最初に読まれる
	constructor(props) {
		super(props);

		this.gotSubscriptions = false;
		this.selectedData = [];
		this.selectAllData = [];
		this.state = {
			loading: true,
			favorites: []
		};
	}

	// Reactのライフサイクル マウントされる時に１度だけ実行される
	componentDidMount() {
		this._isMounted = true;
		this.getSubscriptions();
	}

	componentDidUpdate(prevProps) {
		const {
			cards, selected, selectAll
		} = this.props;

		if (!(
			(prevProps.cards === cards)
			&& (prevProps.selected._id === selected._id)
			&& (prevProps.selectAll === selectAll)
		)) {
			this.getSubscriptions(true);
		}
	}

	// unmount時に呼ばれる 終了処理等を記載する
	componentWillUnmount() {
		this._isMounted = false;
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
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
			server, selectAll
		} = this.props;

		// サーバに接続できるか
		const db = database.active;
		if (server && this.hasActiveDB()) {
			let observable = await db.collections
				.get('subscriptions')
				.query(
					Q.where('archived',Q.notEq(true)),
					Q.where('open',  true))
				.observeWithColumns(['room_updated_at', 'unread', 'alert', 'user_mentions', 'f', 't', 'users_count']);

			// お気に入りのみ取得する
			this.querySubscription = observable.subscribe((data) => {

				this.data = data;

				// invisible Secret Card Subscriptions
				const { cards, selected } = this.props;
				const noSecretCards = cards.filter(card => !card.isSecret || card._id === selected._id);
				const noSecretCardIds = noSecretCards.map(card=>card._id);
				this.data = this.data.filter(item => noSecretCardIds.find(id => id===item.c._id));

				this.favorites = this.data.filter((i)=>i.f === true)??[];

				// 値をセットする
				this.internalSetState({
					favorites: this.favorites,
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
	}

	// 全ての値をStateにセットする
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (isIOS && navigation.isFocused()) {
			LayoutAnimation.easeInEaseOut();
		}
		this.setState(...args);
	}

	// DB接続
	hasActiveDB = () => database && database.active;

	// リストをクリック時の画面遷移
	goRoom = (item) => {
		const { isMasterDetail } = this.props;
		goRoom({item, isMasterDetail});
	};

	// リストをクリック時のアクション
	onPressItem = async(item = {}) => {
		if (!item.search) {
			return this.goRoom(item);
		}
		if (item.t === 'd') {
			// if user is using the search we need first to join/create room
			try {
				const { username } = item;
				const result = await RocketChat.createDirectMessage(username);
				if (result.success) {
					return this.goRoom({ rid: result.room._id, name: username, t: 'd' });
				}
			} catch (e) {
				log(e);
			}
		} else {
			return this.goRoom(item);
		}
	}

	// 1項目の表示内容設定
	renderItem = ({ item }) => {
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
				testID={`favorites-list-view-item-${ item.name }`}
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
				selectAll={true}
			/>
		);
	};

	renderSeparator = () => <View style={styles.separator} />

	getScrollRef = ref => this.scroll = ref

	// 一覧表示
	renderScroll = () => {
		const { loading } = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator style={styles.loading} />;
		}

		const { favorites } = this.state;

		return (
			<FlatList
				ref={this.getScrollRef}
				data={favorites}
				extraData={favorites}
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

	render = () => {
		const { theme } = this.props;
		return(
			<SafeAreaView style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='favorites-list-view'>
				<StatusBar/>
				{this.renderScroll()}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	server: state.server.server,
	baseUrl: state.settings.baseUrl || state.server ? state.server.server : '',
	loadingServer: state.server.loading,
	showFavorites: state.sortPreferences.showFavorites,
	useRealName: state.settings.UI_Use_Real_Name,
	StoreLastMessage: state.settings.Store_Last_Message
});

export default connect(mapStateToProps, null)(withDimensions(withTheme(FavoritesListView)));

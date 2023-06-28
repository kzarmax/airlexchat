import React from 'react';
import PropTypes from 'prop-types';
import {
	View,
	FlatList,
	BackHandler,
	Text,
	Keyboard,
	RefreshControl
} from 'react-native';
import SortDropdown from './SortDropdown';
import { connect } from 'react-redux';
import { isEqual, orderBy } from 'lodash';
import Orientation from 'react-native-orientation-locker';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import RoomItem, {ROW_HEIGHT} from '../../presentation/RoomItem';
import styles from './styles';
import log, {logEvent} from '../../utils/log';
import I18n from '../../i18n';
import {
	openSearchHeader as openSearchHeaderAction,
	closeSearchHeader as closeSearchHeaderAction,
	roomsRequest as roomsRequestAction, setSearch as setSearchAction
} from '../../actions/rooms';
import { appStart as appStartAction } from '../../actions/app';

import {isIOS, isTablet} from '../../utils/deviceInfo';
import RoomsListHeaderView from './Header';
import * as HeaderButton from '../../containers/HeaderButton';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import EventEmitter from '../../utils/events';
import {
	KEY_COMMAND,
	handleCommandShowPreferences,
	handleCommandSearching,
	handleCommandSelectRoom,
	handleCommandPreviousRoom,
	handleCommandNextRoom,
	handleCommandShowNewMessage
} from '../../commands';
import { getUserSelector } from '../../selectors/login';
import SearchBox from '../../containers/SearchBox';
import debounce from '../../utils/debounce'
import {themes} from "../../constants/colors";
import StatusBar from '../../containers/StatusBar';
import SafeAreaView from '../../containers/SafeAreaView';
import {MAX_SIDEBAR_WIDTH} from "../../constants/tablet";
import {withDimensions} from "../../dimensions";
import {withSafeAreaInsets} from "react-native-safe-area-context";
import {goRoom} from "../../utils/goRoom";

const INITIAL_NUM_TO_RENDER = isTablet ? 20 : 12;

const shouldUpdateProps = [
	'selectAll',
	'useRealName',
	'StoreLastMessage',
	'appState',
	'refreshing',
	'width'
];
const getItemLayout = (data, index) => ({
	length: ROW_HEIGHT,
	offset: ROW_HEIGHT * index,
	index
});
const keyExtractor = item => item.rid;

class RoomsListView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		isMasterDetail: PropTypes.bool,
		cards: PropTypes.array,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		server: PropTypes.string,
		refreshing: PropTypes.bool,
		useRealName: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		appState: PropTypes.string,
		openSearchHeader: PropTypes.func,
		closeSearchHeader: PropTypes.func,
		appStart: PropTypes.func,
		roomsRequest: PropTypes.func,
		setSearch: PropTypes.func,
		width: PropTypes.number,
		insets: PropTypes.object,
		theme: PropTypes.string,
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		this.gotSubscriptions = false;
		this.animated = false;
		this.state = {
			search: [],
			searchMessages:[],
			searchText: '',
			loading: true,
			showSortDropdown: false,
			showOnlyBlock: false,
			chats: []
		};
		this.setHeader();
	}

	componentDidMount() {
		const {
			navigation, appState
		} = this.props;

		if (appState === 'foreground') {
			this.getSubscriptions();
		}

		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		this.unsubscribeFocus = navigation.addListener('focus', () => {
			Orientation.unlockAllOrientations();
			this.animated = true;
			// Check if there were changes while not focused (it's set on sCU)
			if (this.shouldUpdate) {
				this.forceUpdate();
				this.shouldUpdate = false;
			}
			this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
		});
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.animated = false;
			this.cancelSearch();
			if (this.backHandler && this.backHandler.remove) {
				this.backHandler.remove();
			}
		});

		console.timeEnd(`${ this.constructor.name } mount`);
	}

	UNSAFE_componentWillReceiveProps(nextProps) {
		const { loadingServer } = this.props;

		if (nextProps.server && loadingServer !== nextProps.loadingServer) {
			if (nextProps.loadingServer) {
				this.setState({ loading: true });
			} else {
				this.getSubscriptions();
			}
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { selected, theme } = this.props;

		if(nextProps.theme !== theme){
			return true;
		}
		if (!isEqual(nextProps.selected, selected)) {
			return true;
		}
		// eslint-disable-next-line react/destructuring-assignment
		const propsUpdated = shouldUpdateProps.some(key => nextProps[key] !== this.props[key]);
		if (propsUpdated) {
			return true;
		}

		const {
			loading,
			search,
			showSortDropdown,
			showOnlyBlock,
			chats,
			searchText
		} = this.state;

		if (nextState.searchText !== searchText) {
			return true;
		}

		if (nextState.loading !== loading) {
			return true;
		}
		if (!isEqual(nextState.chats, chats)) {
			return true;
		}
		if (!isEqual(nextState.search, search)) {
			return true;
		}
		if (nextState.showSortDropdown !== showSortDropdown) {
			return true;
		}
		return nextState.showOnlyBlock !== showOnlyBlock;
	}

	async componentDidUpdate(prevProps, prevState) {
		const {
			selected,
			selectAll,
			appState,
			connected,
			roomsRequest,
			rooms,
			isMasterDetail,
			insets
		} = this.props;

		const{ showOnlyBlock, searchText } = this.state;

		if (
			!(
				isEqual(prevProps.selected, selected)
				&& (prevProps.selectAll === selectAll)
				&& (prevState.showOnlyBlock === showOnlyBlock)
			)
		) {
			this.getSubscriptions();
			if(searchText.trim().length > 0){
				this.search(searchText);
			}
		} else if (
			appState === 'foreground'
			&& appState !== prevProps.appState
			&& connected
		) {
			roomsRequest();
		}

		if (isMasterDetail && item?.rid !== rooms[0] && !isEqual(rooms, prevProps.rooms)) {
			// eslint-disable-next-line react/no-did-update-set-state
			this.setState({ item: { rid: rooms[0] } });
		}
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
			this.setHeader();
		}
	}

	componentWillUnmount() {
		this.unsubscribeQuery();
		if (this.unsubscribeFocus){
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	setHeader = () => {
		const { navigation } = this.props;
		navigation.setOptions({
			headerLeft: () => <HeaderButton.Drawer navigation={navigation}  openDrawer={this.openDrawer} testID='rooms-list-view-sidebar' />,
			headerTitle: () => <RoomsListHeaderView navigation={navigation}/>,
			headerRight: () =>
				<HeaderButton.Container>
					<HeaderButton.Item title='menu' iconName='kebab' onPress={this.onToggleDropDown} testID='rooms-list-view-create-channel' />
				</HeaderButton.Container>
		});
	}

	internalSetState = (...args) => {
		if (this.animated) {
			animateNextTransition();
		}
		this.setState(...args);
	};

	getSubscriptions = async() => {
		this.unsubscribeQuery();

		const {
			selected,
			selectAll
		} = this.props;

		const db = database.active;
		let observable;

		const defaultWhereClause = [
			Q.where('archived', false),
			Q.where('open', true)
		];

		if(selectAll) {
			observable = await db.collections
				.get('subscriptions')
				.query(
					...defaultWhereClause
				)
				.observeWithColumns(['room_updated_at', 'unread', 'reads', 'alert', 'user_mentions', 't', 'users_count']);
		}
		else if(selected) {
			observable = await db.collections
				.get('subscriptions')
				.query(
					...defaultWhereClause,
					Q.where('cardId',selected._id)
				)
				.observeWithColumns(['room_updated_at', 'unread', 'reads', 'alert', 'user_mentions', 't', 'users_count']);
		} else {
			return;
		}

		this.querySubscription = observable.subscribe((data) => {
			this.data = orderBy(data, ['lastMessage.ts'], ['desc']);

			const { selectAll } = this.props;
			const { showOnlyBlock } = this.state;

			if(selectAll){
				// invisible Secret Card Subscriptions
				const { cards } = this.props;
				const noSecretCards = cards.filter(card => !card.isSecret);
				const noSecretCardIds = noSecretCards.map(card=>card._id);
				this.data = this.data.filter(item => noSecretCardIds.find(id => id===item.c._id));
			}

			if(showOnlyBlock)
			{
				this.data = this.data.filter(item => item.blocker);
			}

			// // unread
			// if (showUnread) {
			// 	this.unread = this.data.filter(s => filterIsUnread(s));
			// }
			// else {
			// 	this.unread = [];
			// }
			//
			// // favorites
			// if (showFavorites) {
			// 	this.favorites = this.data.filter(s => filterIsFavorite(s));
			// }
			// else{
			// 	this.favorites = [];
			// }

			// type
			// if (groupByType) {
			// 	// this.discussions = this.data.filter(s => s.prid);
			// 	// this.channels = this.data.filter(s => s.t === 'c' && !s.prid);
			// 	// this.privateGroup = this.data.filter(s => s.t === 'p' && !s.prid);
			// 	// this.direct = this.data.filter(s => s.t === 'd' && !s.prid);
			// 	// this.livechat = this.data.filter(s=>s.t === 'l' && !s.prid)
			// } else if (showUnread) {
			// 	this.chats = this.data.filter(s => s.unread === 0 && s.alert === false);
			// } else {
			// 	this.chats = this.data;
			// }

			this.chats = this.data;

			this.internalSetState({
				chats: this.chats,
				// unread: this.unread,
				// favorites: this.favorites,
				// discussions: this.discussions,
				// channels: this.channels,
				// privateGroup: this.privateGroup,
				// direct: this.direct,
				// livechat: this.livechat,
				loading: false
			});
		});
	}

	unsubscribeQuery = () => {
		if (this.querySubscription && this.querySubscription.unsubscribe) {
			this.querySubscription.unsubscribe();
		}
	}

	handleBackPress = () => {
		const { search } = this.state;
		const { appStart } = this.props;
		if (search.length) {
			this.cancelSearch();
			return true;
		}
		//appStart({ root: ROOT_BACKGROUND });
		return false;
	};

	// eslint-disable-next-line react/sort-comp
	search = debounce(async(text) => {
		const result = await RocketChat.search({ text });
		const { setSearch } = this.props;
		setSearch(text);

		this.internalSetState({
			search: result.data,
			searchMessages: result.search_messages??[],
			searchText: text
		});
		this.scrollToTop();
	}, 300);

	searchSubmit = (event) => {
		Keyboard.dismiss();
		this.search(event.nativeEvent.text);
	}

	cancelSearch = () => {
		const { setSearch } = this.props;
		setSearch('');
		this.inputRef.clear();
		Keyboard.dismiss();
		this.setState({ search: [], searchMessages: [], searchText: '' });
	}

	getRoomTitle = (item) => RocketChat.getRoomTitle(item);

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	isGroupChat = item => RocketChat.isGroupChat(item)

	isRead = item => RocketChat.isRead(item)

	getUserPresence = uid => RocketChat.getUserPresence(uid)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room);

	goRoom = (item) => {
		const { isMasterDetail } = this.props;
		const { searchMessages, searchText } = this.state;
		this.item = item;
		const searchedMessage = searchMessages.find(sm => sm.rid === item.rid);
		goRoom({item, isMasterDetail, searchedMessage, searchText});
	};

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
					return this.goRoom({
						rid: result.room._id,
						cardId: result.room.cardId,
						name: username,
						t: 'd'
					});
				}
			} catch (e) {
				log(e);
			}
		} else {
			return this.goRoom(item);
		}
	};

	closeDropDown = () => {
		this.setState({showSortDropdown: false});
	};


	onToggleDropDown = () =>{
		const {showSortDropdown} = this.state;
		Keyboard.dismiss();
		this.setState({showSortDropdown: !showSortDropdown})
	};

	openDrawer = () => {
		const { navigation } = this.props;
		Keyboard.dismiss();
		navigation.toggleDrawer();
	};

	scrollToTop = () => {
		if (this.scroll?.scrollToOffset) {
			this.scroll.scrollToOffset({ offset: 0 });
		}
	}

	showOnlyBlock = (onlyBlock = false) => {
		this.setState({showOnlyBlock: onlyBlock});
	};

	toggleFav = async(rid, cardId, favorite) => {
		try {
			const db = database.active;
			const result = await RocketChat.toggleFavorite(rid, cardId, !favorite);
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update((sub) => {
							sub.f = !favorite;
						});
					} catch (e) {
					}
				});
			}
		} catch (e) {
		}
	};

	toggleNotify = async(rid, cardId, notifications) => {
		try {
			await RocketChat.saveNotificationSettings(rid, cardId, notifications);
		} catch (e) {
		}
	};

	toggleBlock = async(rid, cardId, blocker) => {
		try {
			await RocketChat.toggleBlockUser(rid, cardId, null, !blocker);
		} catch (e) {
		}
	};

	goDirectory = () => {
		const { navigation } = this.props;
		navigation.navigate('DirectoryView');
	};

	goRoomByIndex = (index) => {
		const { chats } = this.state;
		const filteredChats = chats.filter(c => !c.separator);
		const room = filteredChats[index - 1];
		if (room) {
			this.goRoom(room);
		}
	}

	findOtherRoom = (index, sign) => {
		const { chats } = this.state;
		const otherIndex = index + sign;
		const otherRoom = chats[otherIndex];
		if (!otherRoom) {
			return;
		}
		if (otherRoom.separator) {
			return this.findOtherRoom(otherIndex, sign);
		} else {
			return otherRoom;
		}
	}

	// Go to previous or next room based on sign (-1 or 1)
	// It's used by iPad key commands
	goOtherRoom = (sign) => {
		if (!this.item) {
			return;
		}
		// Don't run during search
		const { search } = this.state;
		if (search.length > 0) {
			return;
		}

		const { chats } = this.state;
		const index = chats.findIndex(c => c.rid === this.item.rid);
		const otherRoom = this.findOtherRoom(index, sign);
		if (otherRoom) {
			this.goRoom(otherRoom);
		}
	}

	handleCommands = ({ event }) => {
		const { navigation, server } = this.props;
		const { input } = event;
		if (handleCommandShowPreferences(event)) {
			navigation.toggleDrawer();
		} else if (handleCommandSearching(event)) {
			this.scroll.scrollToOffset({ animated: true, offset: 0 });
			this.inputRef.focus();
		} else if (handleCommandSelectRoom(event)) {
			this.goRoomByIndex(input);
		} else if (handleCommandPreviousRoom(event)) {
			this.goOtherRoom(-1);
		} else if (handleCommandNextRoom(event)) {
			this.goOtherRoom(1);
		} else if (handleCommandShowNewMessage(event)) {
			navigation.navigate('NewMessageView', { onPressItem: this.onPressItem });
		}
	};

	getScrollRef = ref => (this.scroll = ref);

	getInputRef = ref => (this.inputRef = ref);

	renderListHeader = () => {
		const { searchText } = this.state;
		return <SearchBox inputRef={ this.getInputRef } onChangeText={this.search} onSubmitEditing={this.searchSubmit} testID='rooms-list-view-search' key='rooms-list-view-search' hasCancel={!!(searchText.length)} onCancelPress={this.cancelSearch}/>;
	};

	renderItem = ({ item }) => {
		if(item.search){
			return null;
		}

		const { item: currentItem, searchMessages } = this.state;
		const {
			user: { username },
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width,
			selectAll
		} = this.props;

		const id = this.getUidDirectMessage(item);
		const searchedMessage = searchMessages.find(sm => sm.rid === item.rid);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				username={username}
				showLastMessage={StoreLastMessage}
				onPress={this.onPressItem}
				testID={`rooms-list-view-item-${ item.name }`}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				toggleFav={this.toggleFav}
				toggleNotify={this.toggleNotify}
				toggleBlock={this.toggleBlock}
				useRealName={useRealName}
				getUserPresence={this.getUserPresence}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				getIsGroupChat={this.isGroupChat}
				getIsRead={this.isRead}
				visitor={item.visitor}
				isFocused={currentItem?.rid === item.rid}
				searchedMessage={searchedMessage && searchedMessage.message}
				selectAll={selectAll}
			/>
		);
	};

	renderSeparator = () => <View style={styles.separator} />

	renderSectionHeader = (header) => (
		<View style={styles.groupTitleContainer}>
			<Text style={styles.groupTitle}>{I18n.t(header)}</Text>
		</View>
	)

	renderList = () => {
		const {
			search, chats,searchText
		} = this.state;

		if (!search && searchText) {
			return (
				<View style={styles.container} />
			);
		}

		if (search.length > 0 && searchText) {
			return (
				<FlatList
					data={search}
					extraData={search}
					keyExtractor={keyExtractor}
					style={styles.list}
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

		if (chats.length > 0) {
			return (
				<View style={styles.container}>
					<FlatList
						data={chats}
						extraData={chats}
						keyExtractor={keyExtractor}
						style={styles.list}
						renderItem={this.renderItem}
						ItemSeparatorComponent={this.renderSeparator}
						ListHeaderComponent={() => this.renderSectionHeader(header)}
						getItemLayout={getItemLayout}
						enableEmptySections
						removeClippedSubviews
						keyboardShouldPersistTaps='always'
						initialNumToRender={12}
						windowSize={7}
					/>
				</View>
			);
		}
		return null;
	}

	renderScroll = () => {
		const { loading, chats, search } = this.state;
		const { refreshing, theme } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		return (
			<FlatList
				ref={this.getScrollRef}
				data={search && search.length ? search : chats}
				extraData={search && search.length ? search : chats}
				keyExtractor={keyExtractor}
				style={{ ...styles.list, backgroundColor: themes[theme].backgroundColor}}
				renderItem={this.renderItem}
				ItemSeparatorComponent={this.renderSeparator}
				getItemLayout={getItemLayout}
				removeClippedSubviews={isIOS}
				keyboardShouldPersistTaps='always'
				initialNumToRender={INITIAL_NUM_TO_RENDER}
				refreshControl={(
					<RefreshControl
						refreshing={refreshing}
						onRefresh={this.onRefresh}
						tintColor={themes[theme].auxiliaryText}
					/>
				)}
				windowSize={9}
				onEndReached={this.onEndReached}
				onEndReachedThreshold={0.5}
			/>
		);
	};

	render = () => {
		const { showSortDropdown, showOnlyBlock } = this.state;
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ backgroundColor: themes[theme].backgroundColor }} testID='rooms-list-view'>
				<StatusBar/>
				{this.renderListHeader()}
				{this.renderScroll()}
				{showSortDropdown ? (
					<SortDropdown
						close={this.closeDropDown}
						onlyBlocks={showOnlyBlock}
						showOnlyBlocks={this.showOnlyBlock}
					/>
				) : null}
			</SafeAreaView>
		);
	};
}

const mapStateToProps = state => ({
	user: getUserSelector(state),
	isMasterDetail: state.app.isMasterDetail,
	server: state.server.server,
	loadingServer: state.server.loading,
	connected: state.server.connected,
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	refreshing: state.rooms.refreshing,
	useRealName: state.settings.UI_Use_Real_Name,
	appState: state.app.ready && state.app.foreground ? 'foreground' : 'background',
	StoreLastMessage: state.settings.Store_Last_Message,
	rooms: state.room.rooms
});

const mapDispatchToProps = dispatch => ({
	openSearchHeader: () => dispatch(openSearchHeaderAction()),
	closeSearchHeader: () => dispatch(closeSearchHeaderAction()),
	appStart: params => dispatch(appStartAction(params)),
	roomsRequest: params => dispatch(roomsRequestAction(params)),
	setSearch: searchText => dispatch(setSearchAction(searchText)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomsListView))));


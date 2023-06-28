import React from 'react';
import PropTypes, { string } from 'prop-types';
import {
	Text,
	View,
	InteractionManager,
	TouchableOpacity,
	ScrollView,
	StatusBar as OsStatusBar,
	FlatList, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import sanitizedRaw from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import { Q } from '@nozbe/watermelondb';
import equal from 'deep-equal';
import { themes } from '../../constants/colors';

import {
	replyBroadcast as replyBroadcastAction
} from '../../actions/messages';

import List from './List';
import database from '../../lib/database';
import RocketChat from '../../lib/rocketchat';
import Message from '../../containers/message';
import MessageActions from '../../containers/MessageActions';
import MessageErrorActions from '../../containers/MessageErrorActions';
import MessageBox from '../../containers/MessageBox';
import ReactionPicker from './ReactionPicker';
import UploadProgress from './UploadProgress';
import styles from './styles';
import log, {LOG_L_LOW, LOG_L_LOWEST, LOG_L_TOP} from '../../utils/log';
import EventEmitter from '../../utils/events';
import I18n from '../../i18n';
import RoomHeaderView from './Header';
import StatusBar from '../../containers/StatusBar';
import Separator from './Separator';
import debounce from '../../utils/debounce';
import { LISTENER } from '../../containers/Toast';
import {getBadgeColor, isBlocked} from '../../utils/room';
import { isAndroid, isIOS, isTablet } from '../../utils/deviceInfo';
import {showErrorAlert, showToast} from '../../utils/info';
import { withTheme } from '../../theme';

import {
	KEY_COMMAND,
	handleCommandScroll,
	handleCommandRoomActions,
	handleCommandReplyLatest
} from '../../commands';
import RoomClass from '../../lib/methods/subscriptions/room';
import { getUserSelector } from '../../selectors/login';
import { CONTAINER_TYPES } from '../../lib/methods/actions';
import ReadReceipt from './ReadReceipt';
import Avatar from '../../containers/Avatar';
import CustomHeaderView from './CustomHeader';
import { RectButton } from "react-native-gesture-handler";
import Modal from 'react-native-modal';
import { setShowingAddEmojiModal } from '../../actions/room';
import EmojiList from './EmojiList';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { withDimensions } from '../../dimensions';
import {getHeaderTitlePosition} from "../../containers/Header";
import {withSafeAreaInsets} from "react-native-safe-area-context";
import SafeAreaView from '../../containers/SafeAreaView';
import Navigation from "../../lib/Navigation";
import Collapsible from "../../containers/Collapsible";
import RightButtons from "./Header/RightButtons";
import CallDropDown from "./CallDropDown";
import {filterRepliedMessage} from "../../utils/url";
const stateAttrsUpdate = [
	'joined',
	'lastOpen',
	'collapsed',
	'readReceiptVisible',
	'canAutoTranslate',
	'showErrorActions',
	'loading',
	'searching',
	'editing',
	'replying',
	'replyText',
	'replyWithMention',
	'reacting',
	'reads',
	'unreadsCount',
	'giftEmojiId',
	'showDownloadGiftModal',
	'giftModalWidth',
	'showCalling'
];
const roomAttrsUpdate = ['f', 'ro', 'blocked', 'blocker', 'notifications', 'archived', 'muted', 'jitsiTimeout', 'tunread'];

class RoomView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		siteName: PropTypes.string.isRequired,
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string,
			showMessageInMainThread: PropTypes.bool
		}),
		userEmojis: PropTypes.array,
		cards: PropTypes.array,
		appState: PropTypes.string,
		useRealName: PropTypes.bool,
		isAuthenticated: PropTypes.bool,
		Message_GroupingPeriod: PropTypes.number,
		Message_TimeFormat: PropTypes.string,
		Message_Read_Receipt_Enabled: PropTypes.bool,
		customEmojis: PropTypes.array,
		screenProps: PropTypes.object,
		isShowingAddEmoji: PropTypes.bool,
		isShowingEmojiKeyboard: PropTypes.bool,
		currentCustomEmoji: PropTypes.string,
		theme: PropTypes.string,
		replyBroadcast: PropTypes.func,
		showAddEmojiModal: PropTypes.func,
		width: PropTypes.number,
		height: PropTypes.number,
		insets: PropTypes.object
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		const { cards } = this.props;
		this.rid = props.route.params?.rid;
		this.cardId = props.route.params?.cardId;
		this.card = cards.find(card=>card._id === this.cardId);
		this.t = props.route.params?.t;
		this.f = props.route.params?.f;
		this.tmid = props.route.params?.tmid;
		this.viewableItems = [];									// Message Ids that are showing on screen.
		const selectedMessage = props.route.params?.message;
		const name = props.route.params?.name;
		const fname = props.route.params?.fname;
		const room = props.route.params?.room??{
			rid: this.rid, cardId: this.cardId, c: this.card, t: this.t, f:this.f, name, fname
		};
		const searchedMessage = props.route.params?.searchedMessage;
		const searchText = props.route.params?.searchText;
		this.unread_message_index = null;
		this.searched_message_index = null;

		this.state = {
			joined: true,
			room,
			roomUpdate: {},
			lastOpen: null,
			reads:[],
			unreadsCount:0,
			readReceiptVisible: false,
			collapsed: true,
			selectedMessage: selectedMessage || {},
			searchedMessage: searchedMessage,
			searchText: searchText,
			canAutoTranslate: false,
			loading: true,
			searching: false,
			showErrorActions: false,
			editing: false,
			replying: !!selectedMessage,
			replyText: null,
			replyWithMention: false,
			reacting: false,
			member:{},
			showDownloadGiftModal: false,
			giftEmojiId: string,
			giftModalWidth: 0,
			showCalling: false
		};
		this.setHeader();

		if (room && room.observe) {
			this.observeRoom(room);
		} else if (this.rid) {
			this.findAndObserveRoom(this.rid);
		}

		if(searchedMessage){
			this.updateRoom();
		}

		this.messagebox = React.createRef();
		this.list = React.createRef();
		this.mounted = false;
		if(this.rid && !this.tmid){
			this.sub = new RoomClass(this.rid, this.cardId);
		}
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		this.offset = 0;
		this.didMountInteraction = InteractionManager.runAfterInteractions(() => {
			const { isAuthenticated } = this.props;
			if(this.rid){
				if (isAuthenticated) {
					this.sub?.subscribe();
					this.init();
				} else {
					EventEmitter.addEventListener('connected', this.handleConnected);
				}
			}
			if (isIOS && this.rid) {
				this.updateUnreadCount();
			}
		});
		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		const { searchedMessage } = this.state;

		if(searchedMessage){
			this.position = 0;
			setTimeout(() => this.scrollToMessage(), 100);
			this.setState({ searching: true});
			LOG_L_LOW('Scroll Message Start : ', this.searched_message_index);
		}

		EventEmitter.addEventListener('ROOM_REMOVED', this.handleRoomRemoved);
		this.getMember();
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { state } = this;
		const { roomUpdate, member } = state;
		const { appState, isShowingAddEmoji, isShowingEmojiKeyboard, currentCustomEmoji, userEmojis, width, height, insets, theme } = this.props;

		if(width !== nextProps.width || height !== nextProps.height){
			return true;
		}
		if (theme !== nextProps.theme) {
			return true;
		}
		if (!equal(nextProps.insets, insets)) {
			return true;
		}
		if(isShowingAddEmoji !== nextProps.isShowingAddEmoji){
			return true;
		}
		if(!equal(userEmojis, nextProps.userEmojis)){
			return true;
		}
		if(isShowingEmojiKeyboard !== nextProps.isShowingEmojiKeyboard){
			return true;
		}
		if(currentCustomEmoji !== nextProps.currentCustomEmoji){
			return true;
		}
		if (appState !== nextProps.appState) {
			return true;
		}

		const stateUpdated = stateAttrsUpdate.some(key => nextState[key] !== state[key]);
		if (stateUpdated) {
			return true;
		}
		if(!equal(member, nextState.member)){
			return true;
		}

		return roomAttrsUpdate.some(key => !equal(nextState.roomUpdate[key], roomUpdate[key]));

	}

	async UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
		const { width, height } = this.props;
		if(width !== nextProps.width || height !== nextProps.height){
			await this.storeDraftMessage(true);
		}
	}

	async componentDidUpdate(prevProps, prevState) {
		const { roomUpdate } = this.state;
		const { appState, width, height, insets, navigation } = this.props;

		if (appState === 'foreground' && appState !== prevProps.appState && this.rid) {
			// Fire List.query() just to keep observables working
			await this.getMessages();
			if (this.list && this.list.current) {
				this.list.current?.query?.();
			}
		}

		// If it's not direct message
		if (this.t !== 'd') {
			if (roomUpdate.topic !== prevState.roomUpdate.topic) {
				this.setHeader();
			}
		}
		// If it's a livechat room
		if (this.t === 'l') {
			if (!equal(prevState.roomUpdate.visitor, roomUpdate.visitor)) {
				this.setHeader();
			}
		}
		if (((roomUpdate.f !== prevState.roomUpdate.f) || (roomUpdate.fname !== prevState.roomUpdate.fname) || (roomUpdate.name !== prevState.roomUpdate.name)) && !this.tmid) {
			this.setHeader();
		}
		if (insets.left !== prevProps.insets.left || insets.right !== prevProps.insets.right) {
			this.setHeader();
		}

		if(width > height){
			OsStatusBar.setHidden(true);
		} else {
			OsStatusBar.setHidden(false);
		}
		if(width !== prevProps.width || height !== prevProps.height){
			this.setHeader();
		}
	}

	async storeDraftMessage(orientation = false){
		const { editing, room } = this.state;

		const db = database.active;
		this.mounted = false;
		if (!editing && this.messagebox && this.messagebox.current) {
			const { text } = this.messagebox.current;

			if(orientation && !text) return;

			let obj;
			if (this.tmid) {
				try {
					const threadsCollection = db.collections.get('threads');
					obj = await threadsCollection.find(this.tmid);
				} catch (e) {
					// Do nothing
				}
			} else {
				obj = room;
			}
			if (obj) {
				try {
					await db.action(async() => {
						await obj.update((r) => {
							r.draftMessage = text;
						});
					});
				} catch (error) {
					// Do nothing
				}
			}
		}

	}

	async componentWillUnmount () {

		await this.storeDraftMessage();

		this.unsubscribe();
		if (this.didMountInteraction && this.didMountInteraction.cancel) {
			this.didMountInteraction.cancel();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
		if (this.subSubscription && this.subSubscription.unsubscribe) {
			this.subSubscription.unsubscribe();
		}
		if (this.queryUnreads && this.queryUnreads.unsubscribe) {
			this.queryUnreads.unsubscribe();
		}
		if (this.scrollTimeOut) {
			clearTimeout(this.scrollTimeOut);
		}
		EventEmitter.removeListener('connected', this.handleConnected);
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
		EventEmitter.removeListener('ROOM_REMOVED', this.handleRoomRemoved);
	}

	setHeader = () => {
		const { room } = this.state;
		const {
			navigation, width, height, insets, route, theme
		} = this.props;

		const rid = room.rid;
		const cardId = room.cardId;
		const f = room.f;
		const t = room.t;

		const starIcon = f ? 'star-filled' : 'star';

		if (!rid) {
			return;
		}
		let title = route.params?.name;

		const headerTitlePosition = getHeaderTitlePosition({ insets, numIconsRight: this.tmid ? 1 : 2 });

		navigation.setOptions({
			headerShown: !(isAndroid && width > height),
			headerTitleAlign: 'left',
			headerTitleContainerStyle: {
				left: headerTitlePosition.left,
				right: headerTitlePosition.right
			},
			headerTitle: () =>
				<RoomHeaderView
					card={room.c}
					tmid={this.tmid}
					title={title}
					type={room.t}
					goRoomActionsView={this.goRoomActionsView}
				/>,
			headerRight: () => (
				<RightButtons
					rid={rid}
					tmid={this.tmid}
					cardId={cardId}
					starIcon={starIcon}
					t={t}
					navigation={navigation}
					theme={theme}
					toggleFav={this.toggleFav}
					toggleCall={this.toggleCall}
					goRoomActionsView={this.goRoomActionsView}
					toggleFollowThread={this.toggleFollowThread}
				/>
			)

		});
	}

	// eslint-disable-next-line react/sort-comp
	goRoomActionsView = () => {
		const { room } = this.state;
		const { navigation, isMasterDetail } = this.props;
		if (isMasterDetail) {
			navigation.navigate('ChatsStack', {
				screen: screen ?? 'RoomActionsView',
				params: {
					rid: this.rid, cardId: this.cardId, t: this.t, room
				}
			});
		} else {
			navigation.navigate('RoomActionsView', {
				rid: this.rid, cardId: this.cardId, t: this.t, room
			});
		}
	}

	updateRoom = async() => {
		const db = database.active;

		try {
			const subCollection = db.collections.get('subscriptions');
			const sub = await subCollection.find(this.rid);

			const { room } = await RocketChat.getRoomInfo(this.rid, this.cardId);

			await db.action(async() => {
				await sub.update((s) => {
					Object.assign(s, room);
				});
			});
		} catch {
			// do nothing
		}
	}

	init = async() => {
		try {
			this.setState({ loading: true });
			const { room, joined } = this.state;
			if (this.tmid) {
				await this.getThreadMessages();
			} else {
				const newLastOpen = new Date();
				await this.getMessages();

				// if room is joined
				if (joined) {
					if (room.alert || room.unread || room.userMentions) {
						this.setLastOpen(room.ls);
					} else {
						this.setLastOpen(null);
					}
					RocketChat.readMessages(room.rid, room.cardId, newLastOpen).catch(e => log(e));
				}
			}

			// We run `canAutoTranslate` again in order to refetch auto translate permission
			// in case of a missing connection or poor connection on room open
			const canAutoTranslate = await RocketChat.canAutoTranslate();

			this.setState({ canAutoTranslate, loading: false });
		} catch (e) {
			this.setState({ loading: false });
			this.retryInit = this.retryInit + 1 || 1;
			if (this.retryInit <= 1) {
				this.retryInitTimeout = setTimeout(() => {
					this.init();
				}, 300);
			}
		}
	}

	findAndObserveRoom = async(rid) => {
		try {
			const db = database.active;
			const subCollection = await db.collections.get('subscriptions');
			const room = await subCollection.find(rid);

			LOG_L_TOP('room', room);
			this.setState({ room });
			if (!this.tmid) {
				this.setHeader();
			}
			this.observeRoom(room);
		} catch (error) {
			if (this.t !== 'd') {
				console.log('Room not found');
				this.internalSetState({ joined: false });
			} else if (this.rid) {
				// We navigate to RoomView before the DM is inserted to the local db
				// So we retry just to make sure we have the right content
				this.retryFindCount = this.retryFindCount + 1 || 1;
				if (this.retryFindCount <= 3) {
					this.retryFindTimeout = setTimeout(() => {
						this.findAndObserveRoom(rid);
						this.init();
					}, 300);
				}
			}
		}
	}

	unsubscribe = async() => {
		if (this.sub && this.sub.unsubscribe) {
			await this.sub.unsubscribe();
		}
		delete this.sub;
	}

	observeRoom = (room) => {
		const observable = room.observe();
		this.subSubscription = observable
			.subscribe((changes) => {
				const roomUpdate = roomAttrsUpdate.reduce((ret, attr) => {
					ret[attr] = changes[attr];
					return ret;
				}, {});
				if (this.mounted) {
					this.internalSetState({ room: changes, roomUpdate });
				} else {
					this.state.room = changes;
					this.state.roomUpdate = roomUpdate;
				}
			});
	}

	errorActionsShow = (message) => {
		this.messageErrorActions?.showMessageErrorActions(message, this.cardId);
	}

	onDownloadGiftEmoji = (emoji_id) => {
		this.setState({ giftEmojiId: emoji_id, showDownloadGiftModal: true });
	}

	onEditInit = (message) => {
		this.setState({ selectedMessage: message, editing: true });
	}

	onEditCancel = () => {
		this.setState({ selectedMessage: {}, editing: false });
	}

	onEditRequest = async(message) => {
		this.setState({ selectedMessage: {}, editing: false });
		try {
			await RocketChat.editMessage(message);
		} catch (e) {
			log(e);
		}
	}

	/**
	 * @Hosokawa 2021/4/12
	 *
	 * @param message
	 * @param mention
	 * @param replyText
	 */
	onReplyInit = (message, mention, replyText = null) => {
		// Fix bug in replying for the replied message
		let reply;
		if(replyText){
			reply = replyText;
		} else {
			reply = filterRepliedMessage(message.msg);
		}
		this.setState({
			selectedMessage: message, replying: true, replyWithMention: mention, replyText:reply
		});
	}

	onReplyCancel = () => {
		this.setState({ selectedMessage: {}, replying: false, replyText: null });
	}

	onReactionInit = (message) => {
		this.setState({ selectedMessage: message, reacting: true });
	}

	onReactionClose = () => {
		this.setState({ selectedMessage: {}, reacting: false });
	}

	onMessageLongPress = (message) => {
		if(message.t !== 'gift_message' && message.t !== 'jitsi_call_started' && message.t !== 'jitsi_video_call_started'){
			if(this.messagebox && this.messagebox.current){
				this.messagebox.current.closeEmoji();
				Keyboard.dismiss();
			}
			this.messageActions?.showMessageActions(message);
		}
	}

	showAttachment = (attachment, uri, title = null, message = {}) => {
		const { navigation } = this.props;
		Keyboard.dismiss();
		if(title){
			return navigation.navigate('AttachmentsView', { title, message, card: this.card });
		}
		navigation.navigate('AttachmentView', { attachment, uri });
	}

	onReactionPress = async(shortname, messageId, cardId) => {
		try {
			await RocketChat.setReaction(shortname, messageId, cardId);
			this.onReactionClose();
		} catch (e) {
			log(e);
		}
	};

	onReactionLongPress = (message) => {
		// this.setState({ selectedMessage: message, readReceiptVisible: true });
		// Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}

	onCloseReactionsModal = () => {
		this.setState({ selectedMessage: {}, readReceiptVisible: false });
	}

	onDiscussionPress = debounce((item) => {
		const { navigation } = this.props;
		navigation.push('RoomView', {
			rid: item.drid, prid: item.rid, name: item.msg, t: 'p'
		});
	}, 1000, true)

	// eslint-disable-next-line react/sort-comp
	updateUnreadCount = async() => {
		const db = database.active;
		const observable = await db.collections
			.get('subscriptions')
			.query(
				Q.where('archived', false),
				Q.where('open', true),
				Q.where('rid', Q.notEq(this.rid))
			)
			.observeWithColumns(['unread']);

		this.queryUnreads = observable.subscribe((data) => {
			const unreadsCount = data.filter(s => s.unread > 0).reduce((a, b) => a + (b.unread || 0), 0);
			this.setState({unreadsCount});
		});
	};

	onThreadPress = debounce(async(item) => {
		const { navigation } = this.props;
		if (item.tmid) {
			if (!item.tmsg) {
				await this.fetchThreadName(item.tmid, item.id);
			}
			navigation.push('RoomView', {
				rid: item.subscription.id, cardId: this.cardId, tmid: item.tmid, name: item.tmsg, t: 'thread'
			});
		} else if (item.tlm) {
			navigation.push('RoomView', {
				rid: item.subscription.id, cardId: this.cardId, tmid: item.id, name: item.msg, t: 'thread'
			});
		}
	}, 1000, true)

	replyBroadcast = (message) => {
		const { replyBroadcast } = this.props;
		replyBroadcast(message);
	}

	handleConnected = () => {
		this.sub?.subscribe();
		this.init();
		EventEmitter.removeListener('connected', this.handleConnected);
	}

	handleRoomRemoved = ({ rid }) => {
		const { room } = this.state;
		if (rid === this.rid) {
			Navigation.navigate('RoomsListView');
			showErrorAlert(I18n.t('Room_removed'), I18n.t('Oops'));
		}
	}

	internalSetState = (...args) => {
		if (!this.mounted) {
			return;
		}
		this.setState(...args);
	}


	onReadsPress = async(reads) => {
		if(this.tmid){
			return;
		}
		this.setState({ reads });
		this.setReadReceiptVisible(true);
	}

	onReadsClose = () => {
		this.setReadReceiptVisible(false);
	}

	setReadReceiptVisible(visible) {
		this.internalSetState({ readReceiptVisible: visible });
	}

	toggleFav = async() => {
		try {
			const { room } = this.state;
			const { rid, cardId, f } = room;
			const db = database.active;
			const result = await RocketChat.toggleFavorite(rid, cardId, !f);
			if (result.success) {
				const subCollection = db.collections.get('subscriptions');
				await db.action(async() => {
					try {
						const subRecord = await subCollection.find(rid);
						await subRecord.update((sub) => {
							sub.f = !f;
						});
					} catch (e) {
					}
				});
			}
		} catch (e) {
		}
	};

	toggleCall = () =>{
		Keyboard.dismiss();
		this.setState({ showCalling: true });
	};

	closeDropDown = () => {
		this.setState({ showCalling: false });
	};

	sendMessage = (message, tmid) => {
		const { user, cards } = this.props;
		const card = cards.find(i=>i._id === this.cardId);
		LOG_L_LOW('Send Message: ', card, this.cardId, this.rid);
		RocketChat.sendMessage(this.rid, card, message, this.tmid || tmid, user).then(() => {
			if (this.list && this.list.current){
				this.list.current.update();
			}
			this.setLastOpen(null);
		});
	};

	getRoomTitle = (room) => {
		const { useRealName } = this.props;
		return ((room.prid || useRealName) && room.fname) || room.name;
	}

	getMessages = () => {
		const { room } = this.state;

		if (room.lastOpen) {
			return RocketChat.loadMissedMessages(room);
		} else {
			return RocketChat.loadMessagesForRoom(room);
		}
	}

	getThreadMessages = () => RocketChat.loadThreadMessages({ tmid: this.tmid, rid: this.rid, cardId: this.cardId })

	getCustomEmoji = (name) => {
		const { customEmojis } = this.props;
		for(let pEmoji of customEmojis){
			if(pEmoji.name === name)
				return pEmoji;
			const childEmojis = Object.keys(pEmoji.children).map(key => pEmoji.children[key]);
			for(let childEmoji of childEmojis){
				if(childEmoji.name === name)
					return childEmoji;
			}
		}
		return null;
	};

	setLastOpen = lastOpen => this.setState({ lastOpen });

	joinRoom = async() => {
		try {
			await RocketChat.joinRoom(this.rid, this.cardId, this.t);
			this.internalSetState({
				joined: true
			});
		} catch (e) {
			log(e, "Join Room Error: ");
		}
	}

	// eslint-disable-next-line react/sort-comp
	fetchThreadName = async(tmid, messageId) => {
		try {
			const { room } = this.state;
			const db = database.active;
			const threadCollection = db.collections.get('threads');
			const messageCollection = db.collections.get('messages');
			const messageRecord = await messageCollection.find(messageId);
			let threadRecord;
			try {
				threadRecord = await threadCollection.find(tmid);
			} catch (error) {
				LOG_L_LOWEST('Thread not found. We have to search for it.');
			}
			if (threadRecord) {
				await db.action(async() => {
					await messageRecord.update((m) => {
						m.tmsg = threadRecord.msg || (threadRecord.attachments && threadRecord.attachments.length && threadRecord.attachments[0].title);
					});
				});
			} else {
				const thread = await RocketChat.getSingleMessage(tmid, this.cardId);
				await db.action(async() => {
					await db.batch(
						threadCollection.prepareCreate((t) => {
							t._raw = sanitizedRaw({ id: thread._id }, threadCollection.schema);
							t.subscription.set(room);
							Object.assign(t, thread);
						}),
						messageRecord.prepareUpdate((m) => {
							m.tmsg = thread.msg || (thread.attachments && thread.attachments.length && thread.attachments[0].title);
						})
					);
				});
			}
		} catch (e) {
			log(e, "Fetch Thread Name Error: ");
		}
	}

	toggleFollowThread = async(isFollowingThread, tmid) => {
		try {
			await RocketChat.toggleFollowMessage(tmid ?? this.tmid, this.cardId, !isFollowingThread);
			EventEmitter.emit(LISTENER, { message: isFollowingThread ? I18n.t('Unfollowed_thread') : I18n.t('Following_thread') });
		} catch (e) {
			log(e);
		}
	}

	getBadgeColor = (messageId) => {
		const { room } = this.state;
		const { theme } = this.props;
		return getBadgeColor({ subscription: room, theme, messageId });
	}

	navToRoomInfo = (navParam) => {
		const { room } = this.state;
		const { navigation } = this.props;
		if (navParam.rid === this.cardId) {
			return;
		}

		navigation.navigate( room.t === 'd'?'OthersProfileView':'RoomInfoView', { ...navParam, room, rid:room.id, cardId: this.cardId });
	}

	callJitsi = (onlyAudio) => {
		RocketChat.callJitsi(this.rid, this.cardId, onlyAudio);
	};

	handleCommands = ({ event }) => {
		if (this.rid) {
			const { room } = this.state;
			const { navigation } = this.props;
			const { input } = event;
			if (handleCommandScroll(event)) {
				const offset = input === 'UIKeyInputUpArrow' ? 100 : -100;
				this.offset += offset;
				this.flatList.scrollToOffset({ offset: this.offset });
			} else if (handleCommandRoomActions(event)) {
				navigation.navigate('RoomActionsView', { rid: this.rid, t: this.t, room });
			} else if (handleCommandReplyLatest(event)) {
				if (this.list && this.list.current) {
					const message = this.list.current.getLastMessage();
					this.onReplyInit(message, false);
				}
			}
		}
	}

	blockAction = ({
		actionId, appId, value, blockId, rid, mid
	}) => RocketChat.triggerBlockAction({
		blockId,
		actionId,
		value,
		mid,
		rid,
		appId,
		container: {
			type: CONTAINER_TYPES.MESSAGE,
			id: mid
		}
	});

	toggleExpanded = () => {
		const { collapsed } = this.state;
		if(collapsed){
			this.getMember();
		}
		this.setState({ collapsed: !collapsed });
	};

	isIgnored = (message) => {
		const { room } = this.state;
		return room?.ignored?.includes?.(message?.u?._id) ?? false;
	}

	renderItem = (item, previousItem, index, textColor) => {
		const { room, lastOpen, canAutoTranslate, selectedMessage, editing, searchedMessage, searchText } = this.state;
		const {
			user,  Message_GroupingPeriod, Message_TimeFormat, useRealName, baseUrl, Message_Read_Receipt_Enabled, isShowingEmojiKeyboard, theme
		} = this.props;
		const { c } = room;
		let dateSeparator = null;
		let showUnreadSeparator = false;

		if (!previousItem) {
			dateSeparator = item.ts;
			showUnreadSeparator = moment(item.ts).isAfter(lastOpen);
		} else {
			showUnreadSeparator = lastOpen
				&& moment(item.ts).isAfter(lastOpen)
				&& moment(previousItem.ts).isBefore(lastOpen);
			if (!moment(item.ts).isSame(previousItem.ts, 'day')) {
				dateSeparator = item.ts;
			}
		}

		showUnreadSeparator = showUnreadSeparator && item.cardId && this.cardId && (item.cardId !== this.cardId);
		if(showUnreadSeparator && !searchedMessage && this.unread_message_index === null){
			this.unread_message_index = previousItem?index + 1:index;

			if(index){
				this.position = 0;
				setTimeout(() => {
					// Unread message is not showing on screen
					if(!this.viewableItems.includes(this.unread_message_index)){
						this.setState({ searching: true});
						LOG_L_TOP('Scroll Message Start : ', this.unread_message_index);
						this.scrollToMessage(false);
					}
				}, 100);
			}
		}
		if(searchedMessage && item.id === searchedMessage.id){
			LOG_L_LOW('found search Message', item, index, searchText);
			this.searched_message_index = index;
		}

		const message = (
				<Message
					item={item}
					user={user}
					card={c}
					rid={room.rid}
					roomType={room.t}
					archived={room.archived}
					broadcast={room.broadcast}
					status={item.status}
					isThreadRoom={!!this.tmid}
					isIgnored={this.isIgnored(item)}
					previousItem={previousItem}
					editingMessage={editing && { id: selectedMessage.id }}
					fetchThreadName={this.fetchThreadName}
					onReactionPress={this.onReactionPress}
					onReactionLongPress={this.onReactionLongPress}
					onLongPress={this.onMessageLongPress}
					onDiscussionPress={this.onDiscussionPress}
					onThreadPress={this.onThreadPress}
					onDownloadGiftEmoji={this.onDownloadGiftEmoji}
					showAttachment={this.showAttachment}
					reactionInit={this.onReactionInit}
					onReadsPress={this.onReadsPress}
					replyBroadcast={this.replyBroadcast}
					errorActionsShow={this.errorActionsShow}
					baseUrl={baseUrl}
					Message_GroupingPeriod={Message_GroupingPeriod}
					timeFormat={Message_TimeFormat}
					useRealName={useRealName}
					isReadReceiptEnabled={Message_Read_Receipt_Enabled}
					isShowingEmojiKeyboard={isShowingEmojiKeyboard}
					searchText={searchText}
					autoTranslateRoom={canAutoTranslate && room.autoTranslate}
					autoTranslateLanguage={room.autoTranslateLanguage}
					navToRoomInfo={this.navToRoomInfo}
					getCustomEmoji={this.getCustomEmoji}
					callJitsi={this.callJitsi}
					blockAction={this.blockAction}
					getThreadBadgeColor={() => this.getBadgeColor(item?.id)}
					toggleFollowThread={this.toggleFollowThread}
					replyInit={this.onReplyInit}
					textColor={textColor}
				/>
		);
		if (showUnreadSeparator || dateSeparator) {
			return (
				<>
					{message}
					<Separator
						ts={dateSeparator}
						unread={showUnreadSeparator}
						textColor={textColor}
						theme={theme}
					/>
				</>
			);
		}

		return message;
	}

	getMember = async () => {
		const { room } = this.state;
		if (room.t !== 'p') {
			return;
		}
		try {
			const roomMember = await RocketChat.getRoomMembers(this.rid, this.cardId, true);
			this.setState({ member: roomMember || {} });
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	}

	renderMember = () => {
		const { theme } = this.props;
		const { member } = this.state;
		const rows = [];
		if (member.total) {
			const avatarRadius = 20;
			const avatarSize = 40;
			const fontSize = 15;

			member.records.forEach((m) => {
				rows.push(
					<View style={{ ...styles.groupMemberContainer }} key={`group-member-list-${ m._id }`}>
						<View style={styles.titleContainer}>
							<Avatar
								key={`group-member-avatar-${ m._id }`}
								borderRadius={avatarRadius}
								type='ca'
								text={m._id}
								size={avatarSize}
							/>
							<Text style={[styles.title, { fontSize, color: themes[theme].bodyText }]} ellipsizeMode='tail' numberOfLines={1}>{m.username}</Text>
						</View>
					</View>
				);
			});
			return(<>
					<View style={styles.sectionSeparatorBorder} />
					<Text style={{ ...styles.nameLabel, color: themes[theme].auxiliaryText }}>{I18n.t('Group_member')}</Text>
					{ rows }
				</>);
		}
		return null;
	};

	goThreadsView = () => {
		const { navigation } = this.props;
		navigation.navigate('ThreadMessagesView', { rid: this.rid, cardId: this.cardId, t: this.t });
	}

	renderCustomHeader = () => {
		const { room, collapsed} = this.state;
		const { theme } = this.props;

		if (room.t === 'p') {
			return (
				<React.Fragment key='room-view-custom-header'>
					<View style={{ ...styles.customHeaderContainer, backgroundColor: themes[theme].bannerBackground }}>
						<CustomHeaderView
							collapsed={collapsed}
							roomIconId={room.o && room.o._id}
							roomUserId={room.o && room.o._id}
							roomName={room.t === 'p' ? room.name : (room.o && room.o.username)}
							tmid={this.tmid}
							tunread={room.tunread}
							toggleExpanded={this.toggleExpanded}
							onGoToThreads={this.goThreadsView}
							t={room.t}
							rid={room.rid}/>
					</View>
					<Collapsible collapsed={collapsed}>
						<ScrollView style={[styles.scrollView, { backgroundColor: themes[theme].bannerBackground }]}>
							{
								room.description?[
									<View style={styles.sectionSeparatorBorder} />,
									<View style={styles.descriptionContainer}>
										<Text style={{ ...styles.itemLabel,  color: themes[theme].auxiliaryText }}>{I18n.t('Description')}</Text>
										<Text
											style={{ color: themes[theme].bodyText }}
											testID={`room-info-view-description`}
										>
											{ room.description }
										</Text>
									</View>
								]: null
							}
							{this.renderMember()}
						</ScrollView>
					</Collapsible>
				</React.Fragment>
			);
		} else {
			return (
				<View style={{ ...styles.customHeaderContainer, backgroundColor: themes[theme].bannerBackground }}>
					<CustomHeaderView
						roomIconId={room.o && room.o._id}
						roomUserId={room.o && room.o.userId}
						roomName={room.t === 'p' ? room.name : (room.o && room.o.username)}
						tmid={this.tmid}
						tunread={room.tunread}
						onGoToThreads={this.goThreadsView}
						t={room.t}
						rid={room.rid}/>
				</View>
			);
		}
	}

	renderAddEmojiModal = () => {
		const { isShowingAddEmoji, showAddEmojiModal, navigation, width, height, theme } = this.props;
		return (
			<Modal
				isVisible={isShowingAddEmoji}
				style={{ ...((width>height)?styles.land_modal:styles.port_modal), backgroundColor: themes[theme].backgroundColor, borderColor: themes[theme].borderColor }}
				onBackdropPress={() => showAddEmojiModal(false)}
				onBackButtonPress={() => showAddEmojiModal(false)}
				animationIn='slideInUp'
				animationOut='slideOutDown'
				useNativeDriver
				hideModalContentWhileAnimating
			>
				<View style={{ flex: 1 }}>
					<Text style={{ ...styles.modalTitle, color: themes[theme].titleText }}>{'スタンプ'}</Text>
					<View style={ styles.emojiSeparator }/>
					<EmojiList
						listRef={ (ref) => {this.emojiFlatlist = ref;}}
						navigation={navigation}
						window={{width, height}}
						theme={theme}
					/>
				</View>
			</Modal>
		);
	};

	renderDownloadGiftEmojiModal = () => {
		const { showDownloadGiftModal, giftEmojiId, giftModalWidth } = this.state;
		const { customEmojis, baseUrl, siteName, width, height } = this.props;

		let category = null;
		let childEmojis = [];
		if(giftEmojiId){
			category = customEmojis.find(item => item.id === giftEmojiId);
			if(category){
				childEmojis =
					Object.keys(category.children)
						.map(key => {
							return {
								content: category.children[key].name,
								title: category.children[key].alias,
								extension: category.children[key].extension,
								isCustom: true
							}
						});
			}
		}
		if(!category || !showDownloadGiftModal) {
			return null;
		}

		let is_landscape = width > height;
		let EMOJIS_PER_ROW =  4;
		if(is_landscape){
			EMOJIS_PER_ROW *= 2;
		}

		const size = giftModalWidth /  EMOJIS_PER_ROW;

		return (
			<Modal
				isVisible={showDownloadGiftModal && category}
				style={is_landscape? styles.land_modal:styles.port_modal}
				onBackdropPress={this.onCloseGiftModal}
				onBackButtonPress={this.onCloseGiftModal}
				animationIn='slideInUp'
				animationOut='slideOutDown'
				useNativeDriver
				hideModalContentWhileAnimating
			>
				<View
					onLayout = {({ nativeEvent: { layout: { width, height } } }) => {this.setState({ giftModalWidth: is_landscape?(width - 64):(width - 32) });}}
					style={styles.giftContainer}>
					<Text style={ styles.modalTitle }>{'プレゼントスタンプ'}</Text>
					<View style={{ flexDirection:'row', alignItems: 'center', marginVertical:(is_landscape? 0:12) }}>
						<CustomEmoji baseUrl={ baseUrl } style={ styles.downloadTitleEmoji } emoji={ category }/>
						<View style={{ paddingHorizontal: 8, width: '100%' }}>
						<Text style={ styles.emojiCreator }>{category.creator??siteName}</Text>
							<Text style={ styles.emojiTitle }>{category.name}</Text>
						</View>
					</View>
					<View style={ styles.emojiSeparator }/>
					<ScrollView style={styles.emojiList}>
						<FlatList
							key={'Gift_Emoji' + EMOJIS_PER_ROW}
							keyExtractor={item => item.content}
							data={childEmojis}
							renderItem={({ item }) => this.renderEmojiItem(item, size)}
							numColumns={EMOJIS_PER_ROW}
							initialNumToRender={40}
							getItemLayout={(data, index) => ({ length: size, offset: size * index, index })}
							showsVerticalScrollIndicator={false}
							showsHorizontalScrollIndicator={false}
							removeClippedSubviews
							{...scrollPersistTaps}
						/>
					</ScrollView>
					<View style={{alignItems: 'center'}}>
						<TouchableOpacity onPress={() => this.downloadGiftEmoji(giftEmojiId)} style={styles.downloadBtn}>
							<Text style={styles.downloadText}>{ I18n.t('Download')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		);
	}

	downloadGiftEmoji = async(id) => {
		try{
			result = await RocketChat.downloadEmoji(id, true);
			this.onCloseGiftModal();
			if(result.success){
				showToast(I18n.t('Success_download_emoji'));
			} else {
				showToast(I18n.t('err_download_emoji'));
			}
		} catch (e){
			log(e, 'Download Gift Emoji Error:');
			this.onCloseGiftModal();
			showToast(I18n.t('err_download_emoji'));
		}

	}

	onCloseGiftModal = () => {
		this.setState({showDownloadGiftModal: false, giftEmojiId: null});
	}

	renderEmojiItem(emoji, size){
		const { baseUrl } = this.props;
		if(size === 0){
			return null;
		}
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.content}
				onPress={() => {}}
				testID={`reaction-picker-${emoji.content}`}
			>
				<CustomEmoji style={[styles.giftChildEmoji, { height: size - 8, width: size - 8 }]} emoji={emoji} baseUrl={baseUrl} />
			</TouchableOpacity>
		);
	}

	renderFooter = () => {
		const {
			joined, room, selectedMessage, editing, replying, replyText, replyWithMention, member
		} = this.state;
		const { navigation, width, height, theme } = this.props;

		if (!this.rid) {
			return null;
		}
		if (!joined && !this.tmid) {
			return (
				<View style={styles.joinRoomContainer} key='room-view-join' testID='room-view-join'>
					<Text style={styles.previewMode}>{I18n.t('You_are_in_preview_mode')}</Text>
					<RectButton
						onPress={this.joinRoom}
						style={styles.joinRoomButton}
						activeOpacity={0.5}
						underlayColor='#fff'
					>
						<Text style={styles.joinRoomText} testID='room-view-join-button'>{I18n.t('Join')}</Text>
					</RectButton>
				</View>
			);
		}
		if (isBlocked(room)) {
			return (
				<View style={styles.blocked}>
					<Text style={styles.previewMode}>{I18n.t('This_room_is_blocked')}</Text>
				</View>
			);
		}

		const messageBox  =
			<MessageBox
				ref={this.messagebox}
				onSubmit={this.sendMessage}
				rid={this.rid}
				cardId={this.cardId}
				cardName={this.card?.username}
				tmid={this.tmid}
				roomType={room.t}
				isFocused={navigation.isFocused}
				message={selectedMessage}
				editing={editing}
				editRequest={this.onEditRequest}
				editCancel={this.onEditCancel}
				replying={replying}
				replyText={replyText}
				replyWithMention={replyWithMention}
				replyCancel={this.onReplyCancel}
				getCustomEmoji={this.getCustomEmoji}
				window={{width, height}}
				navigation={navigation}
				members ={member.records??[]}
				theme={theme}
			/>;

		if(isAndroid && width > height){
			return (
				<View style={{flex:1}}>
					{messageBox}
				</View>
			);
		}
		return messageBox;

	};

	renderActions = () => {
		const { room } = this.state;
		const { user } = this.props;
		const { c } = room;
		return (
			<>
				<MessageActions
					ref={ref => this.messageActions = ref}
					tmid={this.tmid}
					room={room}
					user={user}
					card={c}
					editInit={this.onEditInit}
					replyInit={this.onReplyInit}
					reactionInit={this.onReactionInit}
					onReactionPress={this.onReactionPress}
				/>
				<MessageErrorActions
					ref={ref => this.messageErrorActions = ref}
					tmid={this.tmid}
					selected={this.card}
				/>
			</>
		);
	}

	setListRef = ref => this.flatList = ref;

	/**
	 * #Hosokawa - 2020/12/10
	 * Scroll To Searched Message or Unread line
	 *
	 * @param isSearching
	 * true : Scroll to searched message, false: Scroll to unread line
	 */
	scrollToMessage = (isSearching = true) => {
		if (this.scrollTimeOut) {
			clearTimeout(this.scrollTimeOut);
		}

		LOG_L_TOP(isSearching?'scroll search : ':'scroll unread : ', this.searched_message_index, this.unread_message_index);
		if((isSearching &&  this.searched_message_index === null) || ( !isSearching && this.unread_message_index === null )){
			this.scrollToTop();
			this.scrollTimeOut = setTimeout(() => this.scrollToMessage(isSearching), 50);
		} else{
			const scrollToIndex = () => {
				const scroll_message_index = isSearching?this.searched_message_index:this.unread_message_index;
				if(scroll_message_index > 20 + this.position){
					this.position += 20;
					if (this.scrollTimeOut) {
						clearTimeout(this.scrollTimeOut);
					}
					this.scrollTimeOut = setTimeout(scrollToIndex, 50);
				} else {
					this.position = scroll_message_index;
					this.setState({ searching: false});
				}
				LOG_L_TOP('scrollToIndex: ', this.position);
				if(this.flatList){
					this.flatList.scrollToIndex({
						animated: true,
						index: scroll_message_index,
						viewPosition: 0.5
					});
				}
			};

			scrollToIndex();
		}
	};


	scrollToBottom = () => {
		requestAnimationFrame(() => {
			const offset = isIOS? -400 : -60;
			this.flatList.scrollToOffset({ offset: offset });
		});
	}

	scrollToTop = () => {
		requestAnimationFrame(() => {
			this.offset += 1000;
			if(this.flatList){
				this.flatList.scrollToOffset({ offset: this.offset });
			}
		});

	}

	onScrollToIndexFailed = (info)=>{
		const wait = new Promise(resolve => setTimeout(resolve, 500));
		wait.then(() => {
			LOG_L_LOW('scroll failed', info);
			this.flatList.scrollToIndex({ index: info.index, viewPosition: 0.5, animated: true });
		});
		this.setState({searching: false});
	}

	/**
	 * #Hosokawa 2021/4/19
	 * Fetch Ids of Messages that are showing on screen.
	 *
	 * @param viewableItems
	 */
	onViewableItemsChanged = ({ viewableItems }) => {
		this.viewableItems = viewableItems.map(item => item.index);
	}

	render() {
		const {
			room, readReceiptVisible, selectedMessage, loading, reacting,  reads, member, editing, searching, showCalling
		} = this.state;
		const {
			user, baseUrl, theme, navigation, isShowingEmojiKeyboard, currentCustomEmoji, width, height
		} = this.props;

		let backgroundColor = (this.card.back_color && this.card.back_color !== '#')?this.card.back_color:themes[theme].backgroundColor;
		let textColor = (this.card.text_color && this.card.text_color !== '#')?this.card.text_color:null;

		return (
			<SafeAreaView
				style={{ backgroundColor: backgroundColor }}
				testID='room-view'
			>
				{(width > height)?null:<StatusBar />}
				{(width > height)?null:this.renderCustomHeader()}
				<List
					ref={this.list}
					listRef={this.setListRef}
					rid={room.rid}
					cardId={room.c._id}
					t={room.t}
					tmid={this.tmid}
					theme={theme}
					room={room}
					renderRow={(item, next, index) => this.renderItem(item, next, index, textColor)}
					isLoading={loading}
					isSearching={searching}
					isEditing={editing}
					navigation={navigation}
					scrollToBottom={this.scrollToBottom}
					onScrollToIndexFailed={this.onScrollToIndexFailed}
					onViewableItemsChanged={this.onViewableItemsChanged}
					isShowingEmojiKeyboard={isShowingEmojiKeyboard}
					currentCustomEmoji={currentCustomEmoji}
					window={{width, height}}
					showMessageInMainThread={user.showMessageInMainThread}
				/>
				{this.renderFooter()}
				{this.renderAddEmojiModal()}
				{this.renderDownloadGiftEmojiModal()}
				{this.renderActions()}
				<ReactionPicker
					show={reacting}
					message={selectedMessage}
					onEmojiSelected={this.onReactionPress}
					reactionClose={this.onReactionClose}
				 	baseUrl={baseUrl}
					width={width}
					height={height}
					 />
				<UploadProgress rid={this.rid} user={user} baseUrl={baseUrl} cardId={this.cardId} width={width} theme={theme}/>
				<ReadReceipt
					isVisible={readReceiptVisible}
					close={this.onReadsClose}
					user={user}
					baseUrl={baseUrl}
					members={member.records??[]}
					reads={reads}
					cardId={this.cardId}
					theme={theme}
				/>
				{showCalling ? (
					<CallDropDown
						close={this.closeDropDown}
						callJitsi={this.callJitsi}
						theme={theme}
					/>
				) : null}
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	siteName: state.settings.Site_Name || 'エアレペルソナ',
	user: getUserSelector(state),
	userEmojis: state.login.user.emojis,
	cards: state.cards && state.cards.cards,
	appState: state.app.foreground ? 'foreground' : 'background',
	useRealName: state.settings.UI_Use_Real_Name,
	isAuthenticated: state.login.isAuthenticated,
	Message_GroupingPeriod: state.settings.Message_GroupingPeriod,
	Message_TimeFormat: state.settings.Message_TimeFormat,
	customEmojis: state.customEmojis,
	isShowingAddEmoji: state.room.isShowingAddEmoji,
	isShowingEmojiKeyboard: state.room.isShowingEmojiKeyboard,
	currentCustomEmoji: state.room.currentCustomEmoji,
	Message_Read_Receipt_Enabled: state.settings.Message_Read_Receipt_Enabled
});

const mapDispatchToProps = dispatch => ({
	replyBroadcast: message => dispatch(replyBroadcastAction(message)),
	showAddEmojiModal: (isShowingAddEmoji) => dispatch(setShowingAddEmojiModal(isShowingAddEmoji))
});

export default connect(mapStateToProps, mapDispatchToProps)(withDimensions(withTheme(withSafeAreaInsets(RoomView))));

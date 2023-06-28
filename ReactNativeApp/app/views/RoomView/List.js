import React from 'react';
import { FlatList, RefreshControl, Keyboard, View, Dimensions } from 'react-native';
import PropTypes from 'prop-types';
import { Q } from '@nozbe/watermelondb';
import moment from 'moment';
import isEqual from 'lodash/isEqual';

import styles from './styles';
import database from '../../lib/database';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import log, { LOG_L_LOWEST } from '../../utils/log';
import { isAndroid, isIOS } from '../../utils/deviceInfo';
import { animateNextTransition } from '../../utils/layoutAnimation';
import ActivityIndicator from '../../containers/ActivityIndicator';
import { themes } from '../../constants/colors';
import ScrollBottomButton from './ScrollBottomButton';

const QUERY_SIZE = 50;

class List extends React.Component {
	static propTypes = {
		onEndReached: PropTypes.func,
		renderFooter: PropTypes.func,
		renderRow: PropTypes.func,
		rid: PropTypes.string,
		cardId: PropTypes.string,
		t: PropTypes.string,
		tmid: PropTypes.string,
		theme: PropTypes.string,
		room: PropTypes.object,
		listRef: PropTypes.func,
		isLoading: PropTypes.bool,
		isSearching: PropTypes.bool,
		isEditing:PropTypes.bool,
		window: PropTypes.object,
		isShowingEmojiKeyboard: PropTypes.bool,
		currentCustomEmoji: PropTypes.string,
		scrollToBottom: PropTypes.func,
		onScrollToIndexFailed: PropTypes.func,
		onViewableItemsChanged: PropTypes.func,
		tunread: PropTypes.array,
		ignored: PropTypes.array,
		navigation: PropTypes.object,
		showMessageInMainThread: PropTypes.bool
	};

	// this.state.isLoading works for this.onEndReached and RoomView.init
	static getDerivedStateFromProps(props, state) {
		if (props.isLoading !== state.isLoading) {
			return {
				isLoading: props.isLoading
			};
		}
		return null;
	}

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		this.count = 0;
		this.needsFetch = false;
		this.mounted = false;
		this.animated = false;
		this.state = {
			isLoading: true,
			end: false,
			messages: [],
			refreshing: false,
			isShowingKeyboard: false,
			showScollToBottomButton: false,
			listHeight: 0
		};
		this.query();

		this.unsubscribeFocus = props.navigation.addListener('focus', () => {
			this.animated = true;
		});
		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${ this.constructor.name } mount`);
		this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
			const listHeight = Dimensions.get('window').height - e.endCoordinates.height - 44;
			this.setState({isShowingKeyboard: true, listHeight: listHeight})
		});
		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', (e) =>{
			const listHeight = Dimensions.get('window').height - e.endCoordinates.height - 44;
			this.setState({isShowingKeyboard: false, listHeight: listHeight});
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { isLoading, end, refreshing, showScollToBottomButton, isShowingKeyboard, listHeight } = this.state;
		const { theme, isEditing, isShowingEmojiKeyboard, currentCustomEmoji, window, isSearching, tunread, ignored } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if (isLoading !== nextState.isLoading) {
			return true;
		}
		if (isSearching !== nextProps.isSearching) {
			return true;
		}
		if (isEditing !== nextProps.isEditing){
			return true;
		}
		if (listHeight !== nextState.listHeight) {
			return true;
		}
		if (isShowingEmojiKeyboard !== nextProps.isShowingEmojiKeyboard){
			return true;
		}
		if (currentCustomEmoji !== nextProps.currentCustomEmoji){
			return true;
		}
		if (end !== nextState.end) {
			return true;
		}
		if (refreshing !== nextState.refreshing) {
			return true;
		}
		if(showScollToBottomButton !== nextState.showScollToBottomButton) {
			return true;
		}
		if(isShowingKeyboard !== nextState.isShowingKeyboard) {
			return true;
		}
		if (!isEqual(tunread, nextProps.tunread)) {
			return true;
		}
		if (!isEqual(ignored, nextProps.ignored)) {
			return true;
		}
		return !isEqual(window, nextProps.window);

	}

	componentWillUnmount() {
		this.unsubscribeMessages();
		if (this.onEndReached && this.onEndReached.stop) {
			this.onEndReached.stop();
		}
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.keyboardDidShowListener && this.keyboardDidShowListener.remove){
			this.keyboardDidShowListener.remove();
		}
		if (this.keyboardDidHideListener && this.keyboardDidHideListener.remove){
			this.keyboardDidHideListener.remove();
		}
	}

	fetchData = async() => {
		const {
			loading, end, messages, latest = messages[messages.length - 1]?.ts
		} = this.state;

		if (loading || end) {
			return;
		}

		this.setState({ loading: true });
		const { rid, cardId,  t, tmid } = this.props;
		try {
			let result;
			if (tmid) {
				// `offset` is `messages.length - 1` because we append thread start to `messages` obj
				result = await RocketChat.loadThreadMessages({ tmid, rid, cardId, offset: messages.length - 1 });
			} else {
				result = await RocketChat.loadMessagesForRoom({ rid, cardId,  t, latest });
			}

			this.setState({ end: result.length < QUERY_SIZE, loading: false, latest: result[result.length - 1]?.ts }, () => this.loadMoreMessages(result));
		} catch (e) {
			this.setState({ loading: false });
			log(e);
		}
	}


	// eslint-disable-next-line react/sort-comp
	query = async() => {
		this.count += QUERY_SIZE;
		const { rid, tmid, showMessageInMainThread } = this.props;
		const db = database.active;

		if (tmid) {
			try {
				this.thread = await db.collections
					.get('threads')
					.find(tmid);
			} catch (e) {
			}
			this.messagesObservable = db.collections
				.get('thread_messages')
				.query(
					Q.where('rid', tmid),
					Q.experimentalSortBy('ts', Q.desc),
					Q.experimentalSkip(0),
					Q.experimentalTake(this.count)
				)
				.observe();
		} else if (rid) {
			const whereClause = [
				Q.where('rid', rid),
				Q.experimentalSortBy('ts', Q.desc),
				Q.experimentalSkip(0),
				Q.experimentalTake(this.count)
			];
			if (!showMessageInMainThread) {
				whereClause.push(
					Q.or(
						Q.where('tmid', null),
						Q.where('tshow', Q.eq(true))
					)
				);
			}

			this.messagesObservable = db.collections
				.get('messages')
				.query(...whereClause)
				.observe();
		}

		if (rid) {
			this.unsubscribeMessages();
			this.messagesSubscription = this.messagesObservable
				.subscribe((messages) => {
					if (messages.length <= this.count) {
						this.needsFetch = true;
					}
					if (tmid && this.thread) {
						messages = [...messages, this.thread];
					}

					if (this.mounted) {
						this.setState({ messages }, () => this.update());
					} else {
						this.state.messages = messages;
					}
					this.readThreads();
				});
		}
	}

	reload = () => {
		this.count = 0;
		this.query();
	}

	readThreads = async() => {
		const { cardId, tmid } = this.props;

		if (tmid) {
			try {
				await RocketChat.readThreads(tmid, cardId);
			} catch {
				// Do nothing
			}
		}
	}

	onEndReached = async() => {
		if (this.needsFetch) {
			this.needsFetch = false;
			await this.fetchData();
		}
		this.query();
	}

	loadMoreMessages = (result) => {
		const { end } = this.state;

		if (end) {
			return;
		}

		// handle servers with version < 3.0.0
		let { hideSystemMessages = [] } = this.props;
		if (!Array.isArray(hideSystemMessages)) {
			hideSystemMessages = [];
		}

		if (!hideSystemMessages.length) {
			return;
		}

		const hasReadableMessages = result.length > 0;
		// if this batch doesn't contain any messages that will be displayed, we'll request a new batch
		if (!hasReadableMessages) {
			this.onEndReached();
		}
	}

	onRefresh = () => this.setState({ refreshing: true }, async() => {
		const { messages } = this.state;
		const { rid, cardId, tmid } = this.props;

		if (messages.length) {
			try {
				if (tmid) {
					await RocketChat.loadThreadMessages({ tmid, rid, cardId, offset: messages.length - 1 });
				} else {
					await RocketChat.loadMissedMessages({ rid, cardId,  lastOpen: moment().subtract(7, 'days').toDate() });
				}
			} catch (e) {
				log(e);
			}
		}

		this.setState({ refreshing: false });
	});

	// eslint-disable-next-line react/sort-comp
	update = () => {
		const { animated } = this.state;
		if (animated) {
			animateNextTransition();
		}
		this.forceUpdate();
	};

	unsubscribeMessages = () => {
		if (this.messagesSubscription && this.messagesSubscription.unsubscribe) {
			this.messagesSubscription.unsubscribe();
		}
	};

	getLastMessage = () => {
		const { messages } = this.state;
		if (messages.length > 0) {
			return messages[0];
		}
		return null;
	};

	handleScroll = ({nativeEvent}) => {
		const { contentOffset } = nativeEvent;
		if (contentOffset.y > 0) {
			this.setState({ showScollToBottomButton: true });
		} else {
			this.setState({ showScollToBottomButton: false });
		}

	};

	renderFooter = () => {
		const { isLoading } = this.state;
		const { rid, theme } = this.props;
		if (isLoading && rid) {
			return <ActivityIndicator theme={theme} />;
		}
		return null;
	};

	renderItem = ({ item, index }) => {
		const { messages } = this.state;
		const { renderRow } = this.props;
		return renderRow(item, messages[index + 1], index);
	};

	render() {
		const { listRef, scrollToBottom, window } = this.props;
		const { showScollToBottomButton, messages, refreshing, isShowingKeyboard, listHeight } = this.state;
		const { isShowingEmojiKeyboard, isSearching, onScrollToIndexFailed, onViewableItemsChanged, theme } = this.props;

		let is_landscape = window.width > window.height;
		// todo LandScape In Android Style bug
		let listStyle = null;
		if(is_landscape && isAndroid){
			if(isShowingEmojiKeyboard){
				listStyle = {height: window.height - 310, color: 'black'};
			} else {
				listStyle = {height:isShowingKeyboard?listHeight:window.height - 44, color: 'black'};
			}
		}

		const list = <FlatList
			testID='room-view-messages'
			ref={listRef}
			keyExtractor={item => item.id}
			data={messages}
			extraData={this.state}
			renderItem={this.renderItem}
			contentContainerStyle={styles.contentContainer}
			style={[ styles.list, isSearching&&styles.searchList ]}
			onScroll={this.handleScroll}
			inverted
			removeClippedSubviews={isIOS}
			initialNumToRender={50}
			windowSize={10}
			onEndReachedThreshold={10}
			maxToRenderPerBatch={20}
			onEndReached={this.onEndReached}
			onScrollToIndexFailed={onScrollToIndexFailed}
			onViewableItemsChanged={onViewableItemsChanged}
			ListFooterComponent={this.renderFooter}
			refreshControl={(
				<RefreshControl
					refreshing={refreshing}
					onRefresh={this.onRefresh}
					tintColor={themes[theme].auxiliaryText}
				/>
			)}
			{...scrollPersistTaps}
		/>;
		return (
			<>
				{isSearching? <ActivityIndicator absolute={true} theme={theme} />: null}
				{listStyle?<View style={{...listStyle}}>{ list }</View>:list}
				<ScrollBottomButton
					show={showScollToBottomButton && !isSearching}
					onPress={scrollToBottom}
					landscape={ is_landscape }
					isShowingEmojiKeyboard={isShowingEmojiKeyboard}
					isShowingKeyboard={isShowingKeyboard}
				/>
			</>
		);
	}
}

export default List;

import React from 'react';
import PropTypes from 'prop-types';

import Message from './Message';
import MessageContext from './Context';
import debounce from '../../utils/debounce';
import { SYSTEM_MESSAGES, getMessageTranslation } from './utils';
import messagesStatus, {SERVER_ID} from '../../constants/messagesStatus';
import equal from 'deep-equal';
import { withTheme } from '../../theme';
import {Keyboard} from "react-native";

const messageAttrsUpdate = [
	'unread',
	'readReceiptVisible',
	'members',
	'reads'
];

class MessageContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		previousItem: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			username: PropTypes.string,
			token: PropTypes.string.isRequired
		}),
		card: PropTypes.object,
		rid: PropTypes.string,
		timeFormat: PropTypes.string,
		style: PropTypes.any,
		archived: PropTypes.bool,
		broadcast: PropTypes.bool,
		editingMessage: PropTypes.object,
		baseUrl: PropTypes.string,
		Message_GroupingPeriod: PropTypes.number,
		isReadReceiptEnabled: PropTypes.bool,
		isShowingEmojiKeyboard: PropTypes.bool,
		searchText: PropTypes.string,
		isThreadRoom: PropTypes.bool,
		useRealName: PropTypes.bool,
		room: PropTypes.object,
		autoTranslateRoom: PropTypes.bool,
		autoTranslateLanguage: PropTypes.string,
		status: PropTypes.number,
		getCustomEmoji: PropTypes.func,
		onLongPress: PropTypes.func,
		onReactionPress: PropTypes.func,
		onReadsPress: PropTypes.func,
		onDiscussionPress: PropTypes.func,
		onThreadPress: PropTypes.func,
		errorActionsShow: PropTypes.func,
		getThreadBadgeColor: PropTypes.func,
		replyBroadcast: PropTypes.func,
		reactionInit: PropTypes.func,
		fetchThreadName: PropTypes.func,
		showAttachment: PropTypes.func,
		onReactionLongPress: PropTypes.func,
		onDownloadGiftEmoji: PropTypes.func,
		navToRoomInfo: PropTypes.func,
		callJitsi: PropTypes.func,
		blockAction: PropTypes.func,
		replyInit: PropTypes.func,
		theme: PropTypes.string
	}

	static defaultProps = {
		getCustomEmoji: () => {},
		onLongPress: () => {},
		onReactionPress: () => {},
		onDiscussionPress: () => {},
		onThreadPress: () => {},
		errorActionsShow: () => {},
		replyBroadcast: () => {},
		reactionInit: () => {},
		fetchThreadName: () => {},
		showAttachment: () => {},
		onReactionLongPress: () => {},
		navToRoomInfo: () => {},
		callJitsi: () => {},
		blockAction: () => {},
		archived: false,
		broadcast: false,
		theme: 'light'
	}

	state = { isManualUnignored: false };

	componentDidMount() {
		const { item } = this.props;
		if (item && item.observe) {
			const observable = item.observe();
			this.subscription = observable.subscribe(() => {
				this.forceUpdate();
			});
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { theme, room, status, item, editingMessage, searchText } = this.props;
		if (nextProps.theme !== theme) {
			return true;
		}

		if (!equal(room, nextProps.room)) {
			return true;
		}

		const stateUpdated = messageAttrsUpdate.some(key => item[key] !== nextProps.item[key]);
		if (stateUpdated) {
			return true;
		}

		if(!equal(item.attachments, nextProps.item.attachments)){
			return true;
		}

		if(searchText !== nextProps.searchText){
			return true;
		}

		if(!equal(status, nextProps.status))
		{
			return true;
		}

		if (!equal(editingMessage, nextProps.editingMessage)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
		if (this.subscription && this.subscription.unsubscribe) {
			this.subscription.unsubscribe();
		}
	}

	onPress = debounce(() => {
		const { item, isThreadRoom, isShowingEmojiKeyboard } = this.props;

		// Disable Dismiss Keyboard in showing emoji keyboard
		if(!isShowingEmojiKeyboard)
			Keyboard.dismiss();

		if (((item.tlm || item.tmid) && !isThreadRoom)) {
			this.onThreadPress();
		}
	}, 300, true);

	onLongPress = () => {
		const { archived, onLongPress, item } = this.props;
		if (this.isInfo || this.hasError || archived) {
			return;
		}

		if (onLongPress) {
			onLongPress(item);
		}
	}

	onErrorPress = () => {
		const { errorActionsShow, item } = this.props;
		if (errorActionsShow) {
			errorActionsShow(item);
		}
	}

	onReactionPress = (emoji) => {
		const { onReactionPress, item, card } = this.props;
		if (onReactionPress) {
			onReactionPress(emoji, item.id, card._id);
		}
	}

	onReactionLongPress = () => {
		const { onReactionLongPress, item } = this.props;
		if (onReactionLongPress) {
			onReactionLongPress(item);
		}
	}

	onReply = () => {
		const { replyInit, item } = this.props;
		if (replyInit) {
			replyInit(item, true);
		}
	}

	onReadsPress = () => {
		const { onReadsPress, item } = this.props;
		onReadsPress(item.reads);
	}


	onDiscussionPress = () => {
		const { onDiscussionPress, item } = this.props;
		if (onDiscussionPress) {
			onDiscussionPress(item);
		}
	}

	onDownloadGiftEmoji = (emoji_id) => {
		const { onDownloadGiftEmoji } = this.props;
		if (onDownloadGiftEmoji) {
			onDownloadGiftEmoji(emoji_id);
		}
	}

	onThreadPress = () => {
		const { onThreadPress, item } = this.props;
		if (onThreadPress) {
			onThreadPress(item);
		}
	}

	onShowAttachment = (attachment, uri, title= null) => {
		const { showAttachment, item } = this.props;
		if(title){
			showAttachment(null, null, title, item );
		} else {
			showAttachment(attachment, uri);
		}
	}

	get isHeader() {
		const {
			item, previousItem, broadcast, Message_GroupingPeriod
		} = this.props;
		if (this.hasError || (previousItem && previousItem.status === messagesStatus.ERROR)) {
			return true;
		}
		try {
			return !(previousItem && (
				(previousItem.ts.toDateString() === item.ts.toDateString())
				&& (previousItem.c._id === item.c._id)
				&& !(previousItem.groupable === false || item.groupable === false || broadcast === true)
				&& (item.ts - previousItem.ts < Message_GroupingPeriod * 1000)
				&& (previousItem.tmid === item.tmid)
			));
		} catch (error) {
			return true;
		}
	}

	get isThreadReply() {
		const {
			item, previousItem, isThreadRoom
		} = this.props;
		if (isThreadRoom) {
			return false;
		}

		return !!(previousItem && item.tmid && (previousItem.tmid !== item.tmid) && (previousItem.id !== item.tmid));

	}

	get isThreadSequential() {
		const {
			item, previousItem, isThreadRoom
		} = this.props;
		if (isThreadRoom) {
			return false;
		}
		if (previousItem && item.tmid && ((previousItem.tmid === item.tmid) || (previousItem.id === item.tmid))) {
			return true;
		}
		return false;
	}

	get isInfo() {
		const { item } = this.props;
		return SYSTEM_MESSAGES.includes(item.t);
	}

	get isTemp() {
		const { item } = this.props;
		return item.status === messagesStatus.TEMP || item.status === messagesStatus.ERROR;
	}

	get isIgnored() {
		const { isManualUnignored } = this.state;
		const { isIgnored } = this.props;
		return isManualUnignored ? false : isIgnored;
	}

	get hasError() {
		const { item } = this.props;
		return item.status === messagesStatus.ERROR;
	}

	reactionInit = () => {
		const { reactionInit, item } = this.props;
		if (reactionInit) {
			reactionInit(item);
		}
	}

	replyBroadcast = () => {
		const { replyBroadcast, item } = this.props;
		if (replyBroadcast) {
			replyBroadcast(item);
		}
	}

	render() {
		const {
			item, user, card, roomType, style, editingMessage, archived, baseUrl, useRealName, broadcast, fetchThreadName, timeFormat, isReadReceiptEnabled, autoTranslateRoom, autoTranslateLanguage, navToRoomInfo, getCustomEmoji, isThreadRoom, callJitsi, blockAction, rid, theme, searchText, textColor, getThreadBadgeColor, toggleFollowThread
		} = this.props;
		const {
			id, msg, ts, attachments, urls, reactions, avatar, emoji, c, t, alias, editedBy, role, unread, reads,  drid, dcount, dlm, tmid, tcount, tlm, tmsg, mentions, channels, blocks, autoTranslate: autoTranslateMessage, replies
		} = item;

		let message = msg;
		// "autoTranslateRoom" and "autoTranslateLanguage" are properties from the subscription
		// "autoTranslateMessage" is a toggle between "View Original" and "Translate" state
		if (autoTranslateRoom && autoTranslateMessage) {
			message = getMessageTranslation(item, autoTranslateLanguage) || message;
		}

		const threadBadgeColor = getThreadBadgeColor();
		//console.log('Message Data: msg: ', item);
		//console.log(`Message Data: msg: ${message}   unread: ${unread}  reads`, reads, urls, attachments, channels, mentions, reactions,c, editedBy);

		const isEditing = editingMessage&&editingMessage.id === item.id;
		const isOwn =  c && c._id === card._id;
		const isServer = c && c._id === SERVER_ID;

		return (
			<MessageContext.Provider
				value={{
					user,
					baseUrl,
					card,
					onPress: this.onPress,
					onLongPress: isServer?()=>{}:this.onLongPress,
					reactionInit: this.reactionInit,
					onErrorPress: this.onErrorPress,
					replyBroadcast: this.replyBroadcast,
					onReactionPress: this.onReactionPress,
					onDiscussionPress: this.onDiscussionPress,
					onReactionLongPress: this.onReactionLongPress,
					onReply: this.onReply,
					threadBadgeColor,
					toggleFollowThread,
					replies
				}}
			>
				<Message
					id={id}
					msg={message}
					rid={rid}
					author={c}
					isOwn={isOwn}
					ts={ts}
					type={t}
					attachments={attachments}
					blocks={blocks}
					urls={urls}
					reactions={reactions}
					alias={alias}
					avatar={avatar}
					emoji={emoji}
					timeFormat={timeFormat}
					style={style}
					archived={archived}
					broadcast={broadcast}
					useRealName={useRealName}
					isReadReceiptEnabled={isReadReceiptEnabled}
					unread={unread}
					roomType={roomType}
					reads={reads}
					role={role}
					drid={drid}
					dcount={dcount}
					dlm={dlm}
					tmid={tmid}
					tcount={tcount}
					tlm={tlm}
					tmsg={tmsg}
					textColor={textColor}
					fetchThreadName={fetchThreadName}
					mentions={mentions}
					channels={channels}
					isIgnored={this.isIgnored}
					isEdited={editedBy && !!editedBy.username}
					isHeader={this.isHeader || isOwn}
					isThreadReply={this.isThreadReply}
					isThreadSequential={this.isThreadSequential}
					isThreadRoom={isThreadRoom}
					isInfo={this.isInfo}
					isTemp={this.isTemp}
					isEditing={isEditing}
					hasError={this.hasError}
					onReadsPress={this.onReadsPress}
					downloadGiftEmoji={this.onDownloadGiftEmoji}
					showAttachment={this.onShowAttachment}
					getCustomEmoji={getCustomEmoji}
					navToRoomInfo={isServer?()=>{}:navToRoomInfo}
					callJitsi={callJitsi}
					blockAction={blockAction}
					searchText={searchText}
					theme={theme}
				/>
			</MessageContext.Provider>
		);
	}
}


export default withTheme(MessageContainer);

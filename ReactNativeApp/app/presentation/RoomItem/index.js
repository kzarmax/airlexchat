import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import { ROW_HEIGHT } from './styles';
import { formatDate } from '../../utils/room';
import RoomItem from './RoomItem';
import {notification} from "expo-haptics";

export { ROW_HEIGHT };

const attrs = [
	'width',
	'status',
	'connected',
	'theme',
	'isFocused',
	'forceUpdate',
	'showLastMessage',
	'searchedMessage',
	'selectAll'
];

class RoomItemContainer extends React.Component {
	static propTypes = {
		item: PropTypes.object.isRequired,
		showLastMessage: PropTypes.bool,
		showStatus: PropTypes.bool,
		id: PropTypes.string,
		onPress: PropTypes.func,
		username: PropTypes.string,
		avatarSize: PropTypes.number,
		testID: PropTypes.string,
		width: PropTypes.number,
		status: PropTypes.string,
		toggleFav: PropTypes.func,
		toggleRead: PropTypes.func,
		toggleBlock: PropTypes.func,
		useRealName: PropTypes.bool,
		getUserPresence: PropTypes.func,
		connected: PropTypes.bool,
		theme: PropTypes.string,
		isFocused: PropTypes.bool,
		selectAll: PropTypes.bool,
		getRoomTitle: PropTypes.func,
		getRoomAvatar: PropTypes.func,
		getIsGroupChat: PropTypes.func,
		getIsRead: PropTypes.func,
		swipeEnabled: PropTypes.bool,
		searchedMessage: PropTypes.string,
		cards: PropTypes.array,
		selected: PropTypes.object
	};

	static defaultProps = {
		showStatus: true,
		avatarSize: 50,
		status: 'offline',
		getUserPresence: () => {},
		getRoomTitle: () => 'title',
		getRoomAvatar: () => '',
		getIsGroupChat: () => false,
		getIsRead: () => false,
		swipeEnabled: true
	}

	constructor(props) {
		super(props);
		this.mounted = false;
		this.init();
	}

	componentDidMount() {
		this.mounted = true;
		const { connected, getUserPresence, id } = this.props;
		if (connected && this.isDirect) {
			getUserPresence(id);
		}
	}

	shouldComponentUpdate(nextProps) {
		const { props } = this;
		return !attrs.every(key => props[key] === nextProps[key]);
	}

	componentDidUpdate(prevProps) {
		const { connected, getUserPresence, id } = this.props;
		if (prevProps.connected !== connected && connected && this.isDirect) {
			getUserPresence(id);
		}
	}

	componentWillUnmount() {
		if (this.roomSubscription?.unsubscribe) {
			this.roomSubscription.unsubscribe();
		}
	}

	get isGroupChat() {
		const { item, getIsGroupChat } = this.props;
		return getIsGroupChat(item);
	}

	get isDirect() {
		const { item: { t }, id } = this.props;
		return t === 'd' && id && !this.isGroupChat;
	}

	init = () => {
		const { item } = this.props;
		if (item?.observe) {
			const observable = item.observe();
			this.roomSubscription = observable?.subscribe?.(() => {
				if(this.mounted){
					this.forceUpdate();
				}
			});
		}
	}


	getName(cardId) {
		const { cards } = this.props;
		const target = cards.find(card => (card._id === cardId));
		if (!target) {
			return null;
		}
		return target.name;
	}

	onPress = () => {
		const { item, onPress } = this.props;
		return onPress(item);
	}

	render() {
		const {
			item,
			getRoomTitle,
			getRoomAvatar,
			getIsRead,
			width,
			toggleFav,
			toggleNotify,
			toggleBlock,
			testID,
			theme,
			isFocused,
			avatarSize,
			status,
			showLastMessage,
			showStatus,
			username,
			useRealName,
			swipeEnabled,
			searchedMessage,
			selectAll,
			selected
		} = this.props;
		const name = getRoomTitle(item);
		const avatar = getRoomAvatar(item);
		const date = item.roomUpdatedAt && formatDate(item.roomUpdatedAt);
		const alert = (item.alert || item.tunread?.length);

		let accessibilityLabel = name;
		if (item.unread === 1) {
			accessibilityLabel += `, ${ item.unread } ${ I18n.t('alert') }`;
		} else if (item.unread > 1) {
			accessibilityLabel += `, ${ item.unread } ${ I18n.t('alerts') }`;
		}

		if (item.userMentions > 0) {
			accessibilityLabel += `, ${ I18n.t('you_were_mentioned') }`;
		}

		if (date) {
			accessibilityLabel += `, ${ I18n.t('last_message') } ${ date }`;
		}

		let roomName = name;
		if(item.t === 'p') {
			// If Room is Group Chatting, in RoomName add [(X)]　
			roomName = `${ name }（${item.usersCount??1}）`;
		}

		return (
			<RoomItem
				name={roomName}
				avatar={avatar}
				isGroupChat={this.isGroupChat}
				notifications={item.notifications}
				blocker={item.blocker}
				onPress={this.onPress}
				date={date}
				accessibilityLabel={accessibilityLabel}
				width={width}
				favorite={item.f}
				toggleFav={toggleFav}
				rid={item.rid}
				myCardId={item.c._id}
				myCardName={this.getName(item.c._id)}
				toggleNotify={toggleNotify}
				toggleBlock={toggleBlock}
				testID={testID}
				type={item.t}
				theme={theme}
				isFocused={isFocused}
				size={avatarSize}
				prid={item.prid}
				status={status}
				hideUnreadStatus={item.hideUnreadStatus}
				alert={alert}
				lastMessage={item.lastMessage}
				showLastMessage={showLastMessage}
				showStatus={showStatus}
				username={username}
				useRealName={useRealName}
				unread={item.unread}
				userMentions={item.userMentions}
				groupMentions={item.groupMentions}
				tunread={item.tunread}
				tunreadUser={item.tunreadUser}
				tunreadGroup={item.tunreadGroup}
				swipeEnabled={swipeEnabled}
				searchMessage={searchedMessage}
				selectAll={selectAll}
				selected={selected}
			/>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	let status = 'offline';
	const { id, type, visitor = {} } = ownProps;
	if (state.meteor.connected) {
		if (type === 'd') {
			status = state.activeUsers[id]?.status || 'offline';
		} else if (type === 'l' && visitor?.status) {
			({ status } = visitor);
		}
	}
	return {
		connected: state.meteor.connected,
		cards: state.cards && state.cards.cards,
		selected: state.cards && state.cards.selected,
		status
	};
};

export default connect(mapStateToProps)(RoomItemContainer);

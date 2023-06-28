import moment from 'moment';

import { Rooms, Subscriptions } from '../../../models/server';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../callbacks/server';
import { escapeRegExp } from '../../../../lib/escapeRegExp';

/**
 * Chechs if a messages contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */

export function messageContainsHighlight(message, highlights) {
	if (! highlights || highlights.length === 0) { return false; }

	return highlights.some(function(highlight) {
		const regexp = new RegExp(escapeRegExp(highlight), 'i');
		return regexp.test(message.msg);
	});
}

export function getMentions({ mentions, c: { _id: senderId } }) {
	if (!mentions) {
		return {
			toAll: false,
			toHere: false,
			mentionIds: [],
		};
	}

	const toAll = mentions.some(({ _id }) => _id === 'all');
	const toHere = mentions.some(({ _id }) => _id === 'here');
	const mentionIds = mentions
		.filter(({ _id }) => _id !== senderId && !['all', 'here'].includes(_id))
		.map(({ _id }) => _id);

	return {
		toAll,
		toHere,
		mentionIds,
	};
}

const incGroupMentions = (rid, roomType, excludeCardId, unreadCount) => {
	const incUnreadByGroup = ['all_messages', 'group_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	const incUnread = roomType === 'd' || incUnreadByGroup ? 1 : 0;

	Subscriptions.incGroupMentionsAndUnreadForRoomIdExcludingCardId(rid, excludeCardId, 1, incUnread);
};

const incUserMentions = (rid, roomType, cardIds, unreadCount) => {
	const incUnreadByUser = ['all_messages', 'user_mentions_only', 'user_and_group_mentions_only'].includes(unreadCount);
	const incUnread = roomType === 'd' || incUnreadByUser ? 1 : 0;

	Subscriptions.incUserMentionsAndUnreadForRoomIdAndCardIds(rid, cardIds, 1, incUnread);
};

const getUserIdsFromHighlights = (rid, message) => {
	const highlightOptions = { fields: { userHighlights: 1, 'c._id': 1 } };
	const subs = Subscriptions.findByRoomWithUserHighlights(rid, highlightOptions).fetch();

	return subs
		.filter(({ userHighlights, c: { _id: cardId } }) => userHighlights && messageContainsHighlight(message, userHighlights) && cardId !== message.c._id)
		.map(({ c: { _id: cardId } }) => cardId);
};

export function updateUsersSubscriptions(message, room) {
	if (room != null) {
		const {
			toAll,
			toHere,
			mentionIds,
		} = getMentions(message);

		const cardIds = new Set(mentionIds);

		const unreadSetting = room.t === 'd' ? 'Unread_Count_DM' : 'Unread_Count';
		const unreadCount = settings.get(unreadSetting);

		getUserIdsFromHighlights(room._id, message)
			.forEach((cardId) => cardIds.add(cardId));

		// give priority to user mentions over group mentions
		if (cardIds.size > 0) {
			incUserMentions(room._id, room.t, [...cardIds], unreadCount);
		} else if (toAll || toHere) {
			incGroupMentions(room._id, room.t, message.c._id, unreadCount);
		}

		// this shouldn't run only if has group mentions because it will already exclude mentioned users from the query
		if (!toAll && !toHere && unreadCount === 'all_messages') {
			Subscriptions.incUnreadForRoomIdExcludingCardIds(room._id, [...cardIds, message.c._id]);
		}
	}

	// Update all other subscriptions to alert their owners but without incrementing
	// the unread counter, as it is only for mentions and direct messages
	// We now set alert and open properties in two separate update commands. This proved to be more efficient on MongoDB - because it uses a more efficient index.
	Subscriptions.setAlertForRoomIdExcludingCardId(message.rid, message.c._id);
	Subscriptions.setOpenForRoomIdExcludingCardId(message.rid, message.c._id);
}

export function updateThreadUsersSubscriptions(message, room, replies) {
	// const unreadCount = settings.get('Unread_Count');

	// incUserMentions(room._id, room.t, replies, unreadCount);

	Subscriptions.setAlertForRoomIdAndUserIds(message.rid, replies);

	const repliesPlusSender = [...new Set([message.c._id, ...replies])];

	Subscriptions.setOpenForRoomIdAndCardIds(message.rid, repliesPlusSender);

	Subscriptions.setLastReplyForRoomIdAndCardIds(message.rid, repliesPlusSender, new Date());
}

export function notifyUsersOnMessage(message, room) {
	// skips this callback if the message was edited and increments it if the edit was way in the past (aka imported)
	if (message.editedAt) {
		if (Math.abs(moment(message.editedAt).diff()) > 60000) {
			// TODO: Review as I am not sure how else to get around this as the incrementing of the msgs count shouldn't be in this callback
			Rooms.incMsgCountById(message.rid, 1);
			return message;
		}

		// only updates last message if it was edited (skip rest of callback)
		if (settings.get('Store_Last_Message') && (!message.tmid || message.tshow) && (!room.lastMessage || room.lastMessage._id === message._id)) {
			Rooms.setLastMessageById(message.rid, message);
		}

		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	// if message sent ONLY on a thread, skips the rest as it is done on a callback specific to threads
	if (message.tmid && !message.tshow) {
		Rooms.incMsgCountById(message.rid, 1);
		return message;
	}

	// Update all the room activity tracker fields
	Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, settings.get('Store_Last_Message') && message);

	updateUsersSubscriptions(message, room);

	return message;
}

callbacks.add('afterSaveMessage', notifyUsersOnMessage, callbacks.priority.LOW, 'notifyUsersOnMessage');

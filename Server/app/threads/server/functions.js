import { Messages, Subscriptions } from '../../models/server';
import { getMentions } from '../../lib/server/lib/notifyUsersOnMessage';

export const reply = ({ tmid }, message, parentMessage, followers) => {
	const { rid, ts, c, editedAt } = message;
	if (!tmid || editedAt) {
		return false;
	}

	const { toAll, toHere, mentionIds } = getMentions(message);

	const addToReplies = [
		...new Set([
			...followers,
			...mentionIds,
			...Array.isArray(parentMessage.replies) && parentMessage.replies.length ? [c._id] : [parentMessage.c._id, c._id],
		]),
	];

	Messages.updateRepliesByThreadId(tmid, addToReplies, ts);

	const replies = Messages.getThreadFollowsByThreadId(tmid);

	const repliesFiltered = replies
		.filter((cardId) => cardId !== c._id)
		.filter((cardId) => !mentionIds.includes(cardId));

	if (toAll || toHere) {
		Subscriptions.addUnreadThreadByRoomIdAndCardIds(rid, repliesFiltered, tmid, { groupMention: true });
	} else {
		Subscriptions.addUnreadThreadByRoomIdAndCardIds(rid, repliesFiltered, tmid);
	}

	mentionIds.forEach((mentionId) =>
		Subscriptions.addUnreadThreadByRoomIdAndCardIds(rid, [mentionId], tmid, { userMention: true }),
	);
};

export const undoReply = ({ tmid }) => {
	if (!tmid) {
		return false;
	}

	const { ts } = Messages.getFirstReplyTsByThreadId(tmid) || {};
	if (!ts) {
		return Messages.unsetThreadByThreadId(tmid);
	}

	return Messages.updateThreadLastMessageAndCountByThreadId(tmid, ts, -1);
};

export const follow = ({ tmid, cardId }) => {
	if (!tmid || !cardId) {
		return false;
	}

	Messages.addThreadFollowerByThreadId(tmid, cardId);
};

export const unfollow = ({ tmid, rid, cardId }) => {
	if (!tmid || !cardId) {
		return false;
	}

	Subscriptions.removeUnreadThreadByRoomIdAndCardId(rid, cardId, tmid);

	return Messages.removeThreadFollowerByThreadId(tmid, cardId);
};

export const readThread = ({ cardId, rid, tmid }) => {
	const fields = { tunread: 1 };
	const sub = Subscriptions.findOneByRoomIdAndCardId(rid, cardId, { fields });
	if (!sub) {
		return;
	}
	// if the thread being marked as read is the last one unread also clear the unread subscription flag
	const clearAlert = sub.tunread?.length <= 1 && sub.tunread.includes(tmid);

	Subscriptions.removeUnreadThreadByRoomIdAndCardId(rid, cardId, tmid, clearAlert);

	// Threadメッセージの既読にcardId追加
	Messages.setAsThreadRead(rid, tmid, cardId);
};

export const readAllThreads = (rid, cardId) => Subscriptions.removeAllUnreadThreadsByRoomIdAndCardId(rid, cardId);

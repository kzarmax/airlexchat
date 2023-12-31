import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { isTheLastMessage } from '../../lib';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';
import { hasPermission } from '../../authorization';
import { Subscriptions, Messages, Users, Rooms, Cards } from '../../models';

const recursiveRemove = (msg, deep = 1) => {
	if (!msg) {
		return;
	}

	if (deep > settings.get('Message_QuoteChainLimit')) {
		delete msg.attachments;
		return msg;
	}

	msg.attachments = Array.isArray(msg.attachments) ? msg.attachments.map(
		(nestedMsg) => recursiveRemove(nestedMsg, deep + 1),
	) : null;

	return msg;
};

const shouldAdd = (attachments, attachment) => !attachments.some(({ message_link }) => message_link && message_link === attachment.message_link);

Meteor.methods({
	pinMessage(message, cardId, pinnedAt) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'pinMessage',
			});
		}
		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'pinMessage',
			});
		}

		if (!settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		if (!hasPermission(Meteor.userId(), 'pin-message', message.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(message.rid, cardId, { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		let originalMessage = Messages.findOneById(message._id);
		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are pinning was not found', {
				method: 'pinMessage',
				action: 'Message_pinning',
			});
		}

		const me = Users.findOneById(userId);

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			Messages.cloneAndSaveAsHistoryById(message._id, me);
		}
		const room = Meteor.call('canAccessRoom', message.rid, cardId);

		originalMessage.pinned = true;
		originalMessage.pinnedAt = pinnedAt || Date.now;
		originalMessage.pinnedBy = {
			_id: card._id,
			userId,
			username: card.username,
		};

		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);

		Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		const attachments = [];

		if (Array.isArray(originalMessage.attachments)) {
			originalMessage.attachments.forEach((attachment) => {
				if (!attachment.message_link || shouldAdd(attachments, attachment)) {
					attachments.push(attachment);
				}
			});
		}

		return Messages.createWithTypeRoomIdMessageAndCard(
			'message_pinned',
			originalMessage.rid,
			'',
			card,
			{
				attachments: [
					{
						text: originalMessage.msg,
						author_name: originalMessage.c.username,
						author_icon: getUserAvatarURL(
							originalMessage.c.username
						),
						ts: originalMessage.ts,
						attachments: recursiveRemove(attachments),
					},
				],
			},
		);
	},
	unpinMessage(message, cardId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unpinMessage',
			});
		}
		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unpinMessage',
			});
		}

		if (!settings.get('Message_AllowPinning')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message pinning not allowed', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		if (!hasPermission(Meteor.userId(), 'pin-message', message.rid)) {
			throw new Meteor.Error('not-authorized', 'Not Authorized', { method: 'pinMessage' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(message.rid, cardId, { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}

		let originalMessage = Messages.findOneById(message._id);

		if (originalMessage == null || originalMessage._id == null) {
			throw new Meteor.Error('error-invalid-message', 'Message you are unpinning was not found', {
				method: 'unpinMessage',
				action: 'Message_pinning',
			});
		}

		const me = Users.findOneById(Meteor.userId());

		// If we keep history of edits, insert a new message to store history information
		if (settings.get('Message_KeepHistory')) {
			Messages.cloneAndSaveAsHistoryById(originalMessage._id, me);
		}

		originalMessage.pinned = false;
		originalMessage.pinnedBy = {
			_id: card._id,
			userId: Meteor.userId(),
			username: card.username,
		};
		originalMessage = callbacks.run('beforeSaveMessage', originalMessage);
		const room = Meteor.call('canAccessRoom', message.rid, cardId);
		if (isTheLastMessage(room, message)) {
			Rooms.setLastMessagePinned(room._id, originalMessage.pinnedBy, originalMessage.pinned);
		}

		return Messages.setPinnedByIdAndUserId(originalMessage._id, originalMessage.pinnedBy, originalMessage.pinned);
	},
});

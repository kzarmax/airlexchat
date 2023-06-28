import { Meteor } from 'meteor/meteor';

import logger from './logger';
import { Messages, Subscriptions, Cards } from '../../models';

Meteor.methods({
	unreadMessages(firstUnreadMessage, room, cardId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}
		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'unreadMessages',
			});
		}

		if (room) {
			const lastMessage = Messages.findVisibleByRoomId(room, { limit: 1, sort: { ts: -1 } }).fetch()[0];

			if (lastMessage == null) {
				throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
					method: 'unreadMessages',
					action: 'Unread_messages',
				});
			}

			return Subscriptions.setAsUnreadByRoomIdAndCardId(lastMessage.rid, cardId, lastMessage.ts);
		}

		const originalMessage = Messages.findOneById(firstUnreadMessage._id, {
			fields: {
				u: 1,
				c: 1,
				rid: 1,
				file: 1,
				ts: 1,
			},
		});
		if (originalMessage == null || userId === originalMessage.u._id || cardId === originalMessage.c._id) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'unreadMessages',
				action: 'Unread_messages',
			});
		}
		const lastSeen = Subscriptions.findOneByRoomIdAndCardId(originalMessage.rid, cardId).ls;
		if (firstUnreadMessage.ts >= lastSeen) {
			return logger.connection.debug('Provided message is already marked as unread');
		}
		logger.connection.debug(`Updating unread  message of ${ originalMessage.ts } as the first unread`);
		return Subscriptions.setAsUnreadByRoomIdAndCardId(originalMessage.rid, cardId, originalMessage.ts);
	},
});

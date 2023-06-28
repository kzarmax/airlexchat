import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';
import { isTheLastMessage } from '../../lib';
import { Subscriptions, Rooms, Messages, Cards } from '../../models';

Meteor.methods({
	starMessage(message) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		const card = Cards.findOneByIdAndUserId(message.cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'starMessage',
			});
		}

		if (!settings.get('Message_AllowStarring')) {
			throw new Meteor.Error('error-action-not-allowed', 'Message starring not allowed', {
				method: 'pinMessage',
				action: 'Message_starring',
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(message.rid, message.cardId, { fields: { _id: 1 } });
		if (!subscription) {
			return false;
		}
		const room = Meteor.call('canAccessRoom', message.rid, message.cardId);
		if (isTheLastMessage(room, message)) {
			Rooms.updateLastMessageStar(room._id, message.cardId, message.starred);
		}

		return Messages.updateUserStarById(message._id, message.cardId, message.starred);
	},
});

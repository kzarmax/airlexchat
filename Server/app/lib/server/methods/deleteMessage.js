import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { canDeleteMessage } from '../../../authorization/server/functions/canDeleteMessage';
import { Messages, Cards } from '../../../models';
import { deleteMessage } from '../functions';

Meteor.methods({
	deleteMessage(message) {
		check(message, Match.ObjectIncluding({
			_id: String,
			cardId: String,
		}));

		const uid = Meteor.userId();

		if (!uid) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage',
			});
		}

		const card = Cards.findOneByIdAndUserId(message.cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'deleteMessage',
			});
		}

		const originalMessage = Messages.findOneById(message._id, {
			fields: {
				u: 1,
				c: 1,
				rid: 1,
				file: 1,
				ts: 1,
			},
		});

		if (!originalMessage || !canDeleteMessage(uid, message.cardId, originalMessage)) {
			throw new Meteor.Error('error-action-not-allowed', 'Not allowed', {
				method: 'deleteMessage',
				action: 'Delete_message',
			});
		}

		return deleteMessage(originalMessage, Meteor.user(), card);
	},
});

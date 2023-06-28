import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages, Cards } from '../../../models';

Meteor.methods({
	getSingleMessage(msgId, cardId) {
		check(msgId, String);
		check(cardId, String);

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSingleMessage',
			});
		}

		const msg = Messages.findOneById(msgId);

		if (!msg || !msg.rid) {
			return undefined;
		}

		if (!Meteor.call('canAccessRoom', msg.rid, cardId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getSingleMessage' });
		}

		return msg;
	},
});

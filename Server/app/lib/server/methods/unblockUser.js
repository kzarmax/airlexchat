import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../../models';

Meteor.methods({
	unblockUser({ rid, cardId, blocked }) {
		check(rid, String);
		check(cardId, String);
		check(blocked, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(rid, cardId);
		const subscription2 = Subscriptions.findOneByRoomIdAndCardId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		Subscriptions.unsetBlockedByRoomId(rid, blocked, cardId);

		return true;
	},
});

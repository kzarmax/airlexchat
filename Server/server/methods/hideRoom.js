import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	hideRoom(rid, cardId) {
		check(rid, String);
		check(cardId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return Subscriptions.hideByRoomIdAndCardId(rid, cardId);
	},
});

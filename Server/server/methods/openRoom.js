import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	openRoom(rid,cardId) {
		check(rid, String);
		check(cardId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openRoom',
			});
		}

		return Subscriptions.openByRoomIdAndCardId(rid, cardId);
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { markRoomAsRead } from '../lib/markRoomAsRead';
import { canAccessRoom } from '../../app/authorization/server';
import { Rooms, Cards } from '../../app/models/server';

Meteor.methods({
	readMessages(rid, cardId) {
		check(rid, String);
		check(cardId, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'readMessages',
			});
		}

		const card = Cards.findOneById(cardId);
		const room = Rooms.findOneById(rid);
		if (!canAccessRoom(room, card)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'readMessages' });
		}

		markRoomAsRead(rid, userId, cardId);
	},
});

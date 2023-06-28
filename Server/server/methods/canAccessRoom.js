import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Cards, Rooms } from '../../app/models/server';
import { canAccessRoom } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';

Meteor.methods({
	canAccessRoom(rid, cardId, extraData) {
		check(rid, String);
		check(cardId, Match.Maybe(String));

		let card;

		if (cardId) {
			card = Cards.findOneById(cardId, {
				fields: {
					userId: 1,
					username: 1,
				},
			});

			if (!card || !card.username) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoom',
				});
			}
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoom',
			});
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room rid:' + rid + ' cardId: ' + cardId, 'Invalid room', {
				method: 'canAccessRoom',
			});
		}

		if (canAccessRoom.call(this, room, card, extraData)) {
			if (card) {
				room.username = card.username;
			}
			return room;
		}

		if (!cardId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'canAccessRoom',
			});
		}

		return false;
	},
});

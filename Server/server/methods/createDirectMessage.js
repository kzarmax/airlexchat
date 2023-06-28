import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings';
import { hasPermission } from '../../app/authorization';
import { Users, Cards, Rooms } from '../../app/models';
import { RateLimiter } from '../../app/lib';
import { addUser } from '../../app/federation/server/functions/addUser';
import { createRoom } from '../../app/lib/server';

Meteor.methods({
	createDirectMessage(...cardIds) {
		check(cardIds, [String]);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		const me = Meteor.user();
		const myCard = Cards.findOneById(cardIds[0]);

		if (!myCard) {
			throw new Meteor.Error('error-invalid-card', 'Invalid card', {
				method: 'createDirectMessage',
			});
		}

		if (settings.get('Message_AllowDirectMessagesToYourself') === false && cardIds.length === 1 && myCard._id === cardIds[0]) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'createDirectMessage',
			});
		}

		const cards = cardIds.filter((cardId) => cardId !== myCard._id).map((cardId) => {
			const toCard = Cards.findOneById(cardId);

			// // If the username does have an `@`, but does not exist locally, we create it first
			// if (!to && cardId.indexOf('@') !== -1) {
			// 	to = addUser(cardId);
			// }

			if (!toCard) {
				throw new Meteor.Error('error-invalid-card', 'Invalid card', {
					method: 'createDirectMessage',
				});
			}

			return toCard;
		});

		if (!hasPermission(Meteor.userId(), 'create-d')) {
			// If the user can't create DMs but can access already existing ones
			if (hasPermission(Meteor.userId(), 'view-d-room')) {
				// Check if the direct room already exists, then return it

				const cardIds = [myCard, ...cards].map(({ _id }) => _id).sort();
				const room = Rooms.findOneDirectRoomContainingAllCardIDs(cardIds, { fields: { _id: 1 } });
				if (room) {
					return {
						t: 'd',
						rid: room._id,
						...room,
					};
				}
			}

			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'createDirectMessage',
			});
		}

		const { _id: rid, inserted, ...room } = createRoom('d', null, null, [myCard, ...cards], null, { }, { creator: myCard._id });

		return {
			t: 'd',
			rid,
			...room,
		};
	},
});

RateLimiter.limitMethod('createDirectMessage', 10, 60000, {
	userId(userId) {
		return !hasPermission(userId, 'send-many-messages');
	},
});

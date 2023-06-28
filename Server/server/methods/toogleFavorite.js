import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Subscriptions, Cards } from '../../app/models';

Meteor.methods({
	toggleFavorite(rid, cardId, f) {
		check(rid, String);
		check(cardId, String);

		check(f, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite',
			});
		}

		if (!Meteor.call('canAccessRoom', rid, cardId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'toggleFavorite',
			});
		}

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setReaction',
			});
		}

		const userSubscription = Subscriptions.findOneByRoomIdAndCardId(rid, cardId);
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription',
				'You must be part of a room to favorite it',
				{ method: 'toggleFavorite' },
			);
		}

		return Subscriptions.setFavoriteByRoomIdAndCardId(rid, cardId, f);
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Cards, Friends } from '/app/models';
import _ from 'underscore';
import s from 'underscore.string';

Meteor.methods({
	blockCards(cardId, friends) {
		check(cardId, String);
		check(friends, Array);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'blockCards',
			});
		}

		const card = Cards.findOneById(cardId);
		if (!card) {
			return false;
		}

		_.each(friends, function(friend) {
			if (!friend.friendId && !s.trim(friend.friendId)) {
				throw new Meteor.Error('error-the-field-is-required', 'The field friendId is required');
			}

			if (!friend.hasOwnProperty('block')) {
				throw new Meteor.Error('error-the-field-is-required', 'The field block is required');
			}

			const _friend = Friends.findOneById(friend.friendId);
			if (!_friend) {
				return false;
			}

			if (_friend.cardId !== cardId) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			Friends.setBlock(friend.friendId, friend.block);
			if (friend.block) {
				Cards.addBlockByBlockId(cardId, friend.friendId);
			} else {
				Cards.removeBlockByBlockId(cardId, friend.friendId);
			}
		});

		return true;
	},
});

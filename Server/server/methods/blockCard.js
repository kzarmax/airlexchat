import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Cards, Friends } from '/app/models';

Meteor.methods({
	blockCard(cardId, friendId, block) {
		check(cardId, String);
		check(friendId, String);
		check(block, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'blockCard',
			});
		}

		const card = Cards.findOneById(cardId);
		if (!card) {
			return false;
		}

		const friend = Friends.findOneById(friendId);
		if (!friend) {
			return false;
		}

		if (friend.cardId !== cardId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		Friends.setBlock(friendId, block);
		if (block) {
			Cards.addBlockByBlockId(cardId, friendId);
		} else {
			Cards.removeBlockByBlockId(cardId, friendId);
		}

		return true;
	},
});

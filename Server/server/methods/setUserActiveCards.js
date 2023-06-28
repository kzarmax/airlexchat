import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users, Cards } from '/app/models';

Meteor.methods({
	setUserActiveCards(userId, cardIds) {
		check(userId, String);
		check(cardIds, String);

		const ids = cardIds instanceof Array ? cardIds : [cardIds];

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveCards',
			});
		}

		const user = Users.findOneById(userId);

		if (!user) {
			return false;
		}

		if (ids.length === 1 && ids[0] === 'all') {
			Cards.setUserActive(userId, true);
		} else {
			Cards.setUserActive(userId, false);
			Cards.setActiveByIds(ids, true);
		}

		return true;

	},
});

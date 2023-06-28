import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users, Cards } from '/app/models';

Meteor.methods({
	setUserActiveCard(userId, cardId) {
		check(userId, String);
		check(cardId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserActiveStatus',
			});
		}

		const user = Users.findOneById(userId);

		if (!user) {
			return false;
		}

		Cards.setUserActive(userId, false);
		Cards.setActive(cardId, true);
		Users.setSelectAll(userId, false);

		return true;

	},
});

import { Meteor } from 'meteor/meteor';
import { Users, Cards } from '../../app/models';

Meteor.methods({
	setUserActiveCard(userId, cardId) {
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

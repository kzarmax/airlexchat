import { Meteor } from 'meteor/meteor';
import { Users, Cards } from '../../app/models';

Meteor.methods({
	setUserActiveCards(userId, cardIds) {
		const ids = cardIds instanceof Array ? cardIds : [cardIds];
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

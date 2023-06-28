import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models';

Meteor.methods({
	toggleFavorite(rid, cardId, f) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update({
			rid,
			'c._id': cardId,
		}, {
			$set: {
				f,
			},
		});
	},
});

import { Meteor } from 'meteor/meteor';

import { ChatSubscription } from '../../app/models';

Meteor.methods({
	hideRoom(rid, cardId) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update({
			rid,
			'c._id': cardId,
		}, {
			$set: {
				alert: false,
				open: false,
			},
		});
	},
});

import { Meteor } from 'meteor/meteor';

Meteor.methods({
	addUserToRoom(data) {
		return Meteor.call('addUsersToRoom', {
			rid: data.rid,
			cardId: data.inviterId,
			users: [data.cardId],
		});
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users } from '/app/models';
// import { hasPermission } from '/app/authorization';
import { deleteCard } from '/app/lib';

Meteor.methods({
	deleteCard(cardId) {
		check(cardId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteCard',
			});
		}

		// if (hasPermission(Meteor.userId(), 'delete-user') !== true) {
		// 	throw new Meteor.Error('error-not-allowed', 'Not allowed', {
		// 		method: 'deleteCard',
		// 	});
		// }

		const user = Users.findOneById(Meteor.userId());
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to delete', {
				method: 'deleteCard',
			});
		}

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = user.roles.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteCard',
				action: 'Remove_last_admin',
			});
		}

		deleteCard(cardId);

		return true;
	},
});

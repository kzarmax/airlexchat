import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Users, Friends } from '/app/models';
// import { hasPermission } from '/app/authorization';
import { deleteFriend } from '/app/lib';

Meteor.methods({
	deleteFriend(friendId, cardId, friendCardId) {
		check(cardId, String);
		check(friendId, Match.Maybe(String));
		check(friendCardId, Match.Maybe(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteFriend',
			});
		}

		if (!cardId || !cardId.trim()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteFriend',
			});
		}

		if ((!friendId || !friendId.trim()) && (!friendCardId || !friendCardId.trim())) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteFriend',
			});
		}

		// if (hasPermission(Meteor.userId(), 'delete-user') !== true) {
		// 	throw new Meteor.Error('error-not-allowed', 'Not allowed', {
		// 		method: 'deleteFriend',
		// 	});
		// }

		const user = Users.findOneById(Meteor.userId());
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to delete', {
				method: 'deleteFriend',
			});
		}

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = user.roles.indexOf('admin') > -1;

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteFriend',
				action: 'Remove_last_admin',
			});
		}

		let _id = friendId;
		if (!_id) {
			const friend = Friends.findOneByCardIdFriendCardId(cardId, friendCardId);
			if (!friend) {
				return true;
			}
			_id = friend._id;
		}

		const friend = Friends.findOneById(_id, {
			fields: { _id: 1, userId: 1, cardId: 1, friendCardId: 1 },
		});
		if (user._id !== friend.userId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteFriend',
			});
		}

		deleteFriend(_id);

		return true;
	},
});

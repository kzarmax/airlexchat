import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users } from '../../app/models';

Meteor.methods({
	removeEmojiToUser(id) {
		check(id, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword',
			});
		}

		const user = Users.findOneById(userId);

		Users.update({ _id: user._id }, {
			$pull: {
				emojis: id,
			},
		});

		return true;
	},
});

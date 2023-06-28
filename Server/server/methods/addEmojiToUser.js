import { Meteor } from 'meteor/meteor';
import { Users } from '../../app/models';

Meteor.methods({
	addEmojiToUser(emoji, is_gift) {

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'addEmojiToUser',
			});
		}

		const userEmojis = user.emojis;

		if(!userEmojis || !userEmojis.find(emojiId => emojiId === emoji._id)){
			if(!is_gift && emoji.points && emoji.pooints > 0){
				if(!user.points || user.points < 0){
					throw new Meteor.Error('error-invalid-user-points', 'Invalid action', {
						method: 'addEmojiToUser',
					});
				}
				const user_points = user.points - emoji.points;
				Users.update({ _id: user._id }, {
					$set: {
						points: user_points,
					},
					$addToSet: {
						emojis: emoji._id,
					}
				});
			} else {
				Users.update({ _id: user._id }, {
					$addToSet: {
						emojis: emoji._id,
					},
				});
			}
		}

		return true;
	},
});

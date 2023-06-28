import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Cards, Friends } from '../../../models';
import _ from 'underscore';
import { hasPermission } from '../../../authorization';

export const setFriendPermissions = function(userId, cardId, permissions) {
	const card = Cards.findOneById(cardId);

	if (!card) {
		return true;
	}
	console.log(JSON.stringify(permissions));

	if (userId !== card.userId && !hasPermission(userId, 'edit-other-user-info')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed');
	}

	_.each(permissions, function(permission) {
		console.log(JSON.stringify(permission));
		const _id = permission.friendId;
		if (!permission.friendId && !s.trim(permission.friendId)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field friendId is required');
		}

		if (permission.hasOwnProperty('block')) {
			Friends.setBlock(permission.friendId, permission.block);
			if (permission.block) {
				Cards.addBlockByBlockId(cardId, permission.friendId);
			} else {
				Cards.removeBlockByBlockId(cardId, permission.friendId);
			}
		}
		delete permission._id;
		delete permission.friendId;
		delete permission.block;
		console.log(_id);
		console.log(JSON.stringify(permission));

		Friends.updateById(_id, permission);
	});

	return true;
};

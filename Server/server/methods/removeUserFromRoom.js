import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission, hasRole, getUsersInRole, removeUserFromRoles } from '../../app/authorization';
import { Users, Subscriptions, Rooms, Messages, Cards } from '../../app/models';
import { callbacks } from '../../app/callbacks';
import { roomTypes, RoomMemberActions } from '../../app/utils/server';

Meteor.methods({
	removeUserFromRoom(data) {
		check(data, Match.ObjectIncluding({
			rid: String,
			operatorId: String,
			cardId: String
		}));

		const operator = Cards.findOneById(data.operatorId);

		if (!operator || !operator.userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeUserFromRoom',
			});
		}

		if (!hasPermission(operator.userId, 'remove-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom',
			});
		}

		const room = Rooms.findOneById(data.rid);

		if (!room || !roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.REMOVE_USER)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'removeUserFromRoom',
			});
		}

		//const removedUser = Users.findOneByUsernameIgnoringCase(data.username);
		const removedCard = Cards.findOneById(data.cardId);
		const removedUser = Users.findOneById(removedCard.userId);

		const fromUser = Users.findOneById(operator.userId);

		// const subscription = Subscriptions.findOneByRoomIdAndUserId(data.rid, removedUser._id, { fields: { _id: 1 } });
		const subscription = Subscriptions.findOneByRoomIdAndCardId(data.rid, removedCard._id, { fields: { _id: 1 } });

		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'removeUserFromRoom',
			});
		}

		if (hasRole(removedUser._id, 'owner', room._id)) {
			const numOwners = getUsersInRole('owner', room._id).fetch().length;

			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', {
					method: 'removeUserFromRoom',
				});
			}
		}

		// TODO: card ?
		callbacks.run('beforeRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);

		// Subscriptions.removeByRoomIdAndUserId(data.rid, removedUser._id);
		Subscriptions.removeByRoomIdAndCardId(data.rid, removedCard._id);

		if (['c', 'p'].includes(room.t) === true) {
			removeUserFromRoles(removedUser._id, ['moderator', 'owner'], data.rid);
		}

		Messages.createUserRemovedWithRoomIdAndCard(data.rid, removedCard, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		// TODO: card ?
		Meteor.defer(function() {
			callbacks.run('afterRemoveFromRoom', { removedUser, userWhoRemoved: fromUser }, room);
		});

		return true;
	},
});

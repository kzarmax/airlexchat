import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission, hasRole, getUsersInRole } from '../../../authorization';
import { Subscriptions, Rooms, Cards } from '../../../models';
import { removeUserFromRoom } from '../functions';
import { roomTypes, RoomMemberActions } from '../../../utils/server';

Meteor.methods({
	leaveRoom(rid, cardId) {
		check(rid, String);
		check(cardId, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'leaveRoom' });
		}
		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'leaveRoom',
			});
		}

		const room = Rooms.findOneById(rid);
		const user = Meteor.user();

		if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.LEAVE)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
		}

		if ((room.t === 'c' && !hasPermission(user._id, 'leave-c')) || (room.t === 'p' && !hasPermission(user._id, 'leave-p'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'leaveRoom' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(rid, cardId, { fields: { _id: 1 } });
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'You are not in this room', { method: 'leaveRoom' });
		}

		// If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.
		if (hasRole(user._id, 'owner', room._id)) {
			const numOwners = getUsersInRole('owner', room._id).count();
			if (numOwners === 1) {
				throw new Meteor.Error('error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', { method: 'leaveRoom' });
			}
		}

		return removeUserFromRoom(rid, user, card);
	},
});

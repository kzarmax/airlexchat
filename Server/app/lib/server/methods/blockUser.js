import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../../models';
import { roomTypes, RoomMemberActions } from '../../../utils/server';
import { Rooms } from '../../../models/server';

Meteor.methods({
	blockUser({ rid, cardId, blocked }) {
		check(rid, String);
		check(cardId, String);
		check(blocked, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'blockUser' });
		}

		const room = Rooms.findOne({ _id: rid });

		if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.BLOCK)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(rid, cardId);
		const subscription2 = Subscriptions.findOneByRoomIdAndCardId(rid, blocked);

		if (!subscription || !subscription2) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'blockUser' });
		}

		Subscriptions.setBlockedByRoomId(rid, blocked, cardId);

		return true;
	},
});

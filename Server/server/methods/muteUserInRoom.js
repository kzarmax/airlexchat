import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Rooms, Subscriptions, Users, Messages, Cards } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { callbacks } from '../../app/callbacks';
import { roomTypes, RoomMemberActions } from '../../app/utils/server';

Meteor.methods({
	muteUserInRoom(data) {
		check(data, Match.ObjectIncluding({
			rid: String,
			cardId: String,
		}));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom',
			});
		}

		const fromId = Meteor.userId();

		if (!hasPermission(fromId, 'mute-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'muteUserInRoom',
			});
		}

		const room = Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'muteUserInRoom',
			});
		}

		if (!roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.MUTE)) {
			throw new Meteor.Error('error-invalid-room-type', `${ room.t } is not a valid room type`, {
				method: 'muteUserInRoom',
				type: room.t,
			});
		}

		const subscription = Subscriptions.findOneByRoomIdAndCardId(data.rid, data.cardId, { fields: { _id: 1 } });
		if (!subscription) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'muteUserInRoom',
			});
		}

		const card = Cards.findOneById(data.cardId);
		const mutedUser = Users.findOneById(card.userId);

		const fromUser = Users.findOneById(fromId);

		callbacks.run('beforeMuteUser', { mutedUser, fromUser }, room);

		Rooms.muteCardIdByRoomId(data.rid, card._id);

		Messages.createUserMutedWithRoomIdAndCard(data.rid, card, {
			u: {
				_id: fromUser._id,
				username: fromUser.username,
			},
		});

		callbacks.run('afterMuteUser', { mutedUser, fromUser }, room);

		return true;
	},
});

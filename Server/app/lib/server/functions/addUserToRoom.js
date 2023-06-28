import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';

import { AppEvents, Apps } from '../../../apps/server';
import { callbacks } from '../../../callbacks';
import { Messages, Rooms, Subscriptions, Users } from '../../../models';
import { hasPermission } from '../../../authorization';
import { RoomMemberActions, roomTypes } from '../../../utils/server';

export const addUserToRoom = function(rid, card, inviter, silenced) {
	const now = new Date();
	const room = Rooms.findOneById(rid);
	const user = Users.findOneById(card.userId);

	const roomConfig = roomTypes.getConfig(room.t);
	if (!roomConfig.allowMemberAction(room, RoomMemberActions.JOIN) && !roomConfig.allowMemberAction(room, RoomMemberActions.INVITE)) {
		return;
	}

	// Check if user is already in room
	const subscription = Subscriptions.findOneByRoomIdAndCardId(rid, card._id);
	if (subscription) {
		return;
	}

	try {
		Promise.await(Apps.triggerEvent(AppEvents.IPreRoomUserJoined, room, card, inviter));
	} catch (error) {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}

	if (room.t === 'c' || room.t === 'p' || room.t === 'l') {
		// Add a new event, with an optional inviter
		callbacks.run('beforeAddedToRoom', { card, inviter }, room);

		// Keep the current event
		callbacks.run('beforeJoinRoom', card, room);
	}

	const muted = room.ro && !hasPermission(card.userId, 'post-readonly');
	if (muted) {
		Rooms.muteCardIdByRoomId(rid, card._id);
	}

	Promise.await(Apps.triggerEvent(AppEvents.IPreRoomUserJoined, room, card, inviter).catch((error) => {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}));

	Subscriptions.createWithRoomAndUserAndCard(room, user, card, {
		ts: now,
		open: true,
		alert: true,
		unread: 1,
		userMentions: 1,
		groupMentions: 0,
	});

	if (!silenced) {
		if (inviter) {
			Messages.createUserJoinWithRoomIdAndCard(rid, card, {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username,
				},
				c: {
					_id: inviter._id,
					username: inviter.username,
				},
			});
		} else if (room.prid) {
			Messages.createUserJoinWithRoomIdAndCardThread(rid, card, { ts: now });
		} else {
			Messages.createUserJoinWithRoomIdAndCard(rid, card, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function() {
			// Add a new event, with an optional inviter
			callbacks.run('afterAddedToRoom', { card, inviter }, room);

			// Keep the current event
			callbacks.run('afterJoinRoom', card, room);

			Apps.triggerEvent(AppEvents.IPostRoomUserJoined, room, card, inviter);
		});
	}

	return true;
};

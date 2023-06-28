import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions } from '../../../models';
import { callbacks } from '../../../callbacks';

export const removeUserFromRoom = function(rid, user, card, options = {}) {
	const room = Rooms.findOneById(rid);

	if (room) {
		callbacks.run('beforeLeaveRoom', user, room);

		const subscription = Subscriptions.findOneByRoomIdAndCardId(rid, card._id, { fields: { _id: 1 } });

		if (subscription) {
			const removedUser = card;
			if (options.byUser) {
				Messages.createUserRemovedWithRoomIdAndCard(rid, card, {
					u: options.byUser,
				});
			} else {
				Messages.createUserLeaveWithRoomIdAndCard(rid, removedUser);
			}
		}

		if (room.t === 'l') {
			Messages.createCommandWithRoomIdAndCard('survey', rid, card);
		}

		Subscriptions.removeByRoomIdAndCardId(rid, card._id);

		Meteor.defer(function() {
			// TODO: CACHE: maybe a queue?
			callbacks.run('afterLeaveRoom', user, room);
		});
	}
};

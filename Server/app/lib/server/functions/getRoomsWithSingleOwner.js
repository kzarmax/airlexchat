import { subscriptionHasRole } from '../../../authorization/server';
import { Users, Subscriptions } from '../../../models/server';
import {Rooms} from "/app/models";

export function shouldRemoveOrChangeOwner(subscribedRooms) {
	return subscribedRooms
		.some(({ shouldBeRemoved, shouldChangeOwner }) => shouldBeRemoved || shouldChangeOwner);
}

export function getSubscribedRoomsForUserWithDetails(userId) {
	const subscribedRooms = [];

	// Iterate through all the rooms the user is subscribed to, to check if he is the last owner of any of them.
	Subscriptions.findByUserIdExceptType(userId, 'd').forEach((subscription) => {
		const roomData = {
			rid: subscription.rid,
			t: subscription.t,
			shouldBeRemoved: false,
			shouldChangeOwner: false,
			newOwner: null,
		};

		const room = Rooms.findOneById(subscription.rid);
		if (room.c._id === subscription.c._id) {
			roomData.shouldBeRemoved = true;
		} else {
			// If the user is not an owner, remove the room if the user is the only subscriber
			roomData.shouldBeRemoved = Subscriptions.findByRoomId(roomData.rid).count() === 1;
		}

		subscribedRooms.push(roomData);
	});

	return subscribedRooms;
}

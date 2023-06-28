import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';

import { Apps } from '../../../apps/server';
import { callbacks } from '../../../callbacks/server';
import { Rooms, Subscriptions, Users } from '../../../models/server';
import { settings } from '../../../settings/server';
import { getDefaultSubscriptionPref } from '../../../utils/server';

const generateSubscription = (fname, name, user, card, ownerCard, extra) => ({
	alert: false,
	unread: 0,
	userMentions: 0,
	groupMentions: 0,
	...user.customFields && { customFields: user.customFields },
	...getDefaultSubscriptionPref(user),
	...extra,
	t: 'd',
	fname,
	name,
	u: {
		_id: user._id,
		username: user.username,
	},
	c: {
		_id: card._id,
		name: card.name,
		username: card.username,
		userId: card.userId,
	},
	o: {
		_id: ownerCard._id,
		name: ownerCard.name,
		username: ownerCard.username,
		userId: ownerCard.userId,
	},
});

const getFname = (members) => members.map(({ name, username }) => name || username).join(', ');
const getName = (members) => members.map(({ username }) => username).join(', ');

export const createDirectRoom = function(members, roomExtraData = {}, options = {}) {
	if (members.length !== 2) {
		throw new Error('error-direct-message-users-count-not-two');
	}
	if(members[0].userId === members[1].userId){
		throw new Error('error-direct-message-same-user');
	}

	const sortedMembers = members.sort((u1, u2) => (u1.name || u1.username).localeCompare(u2.name || u2.username));

	const usernames = sortedMembers.map(({ username }) => username);
	const cardIds = members.map(({ _id }) => _id).sort();

	// Deprecated: using users' _id to compose the room _id is deprecated
	const room = cardIds.length === 2
		? Rooms.findOneById(cardIds.join(''), { fields: { _id: 1 } })
		: Rooms.findOneDirectRoomContainingAllCardIDs(cardIds, { fields: { _id: 1 } });

	const isNewRoom = !room;

	const roomInfo = {
		...cardIds.length === 2 && { _id: cardIds.join('') }, // Deprecated: using users' _id to compose the room _id is deprecated
		t: 'd',
		usernames,
		usersCount: members.length,
		msgs: 0,
		ts: new Date(),
		uids: cardIds,
		...roomExtraData,
	};

	if (isNewRoom) {
		roomInfo._USERNAMES = usernames;

		const prevent = Promise.await(Apps.triggerEvent('IPreRoomCreatePrevent', roomInfo).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Meteor.Error('error-app-prevented', error.message);
			}

			throw error;
		}));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', roomInfo));
		result = Promise.await(Apps.triggerEvent('IPreRoomCreateModify', result));

		if (typeof result === 'object') {
			Object.assign(roomInfo, result);
		}

		delete roomInfo._USERNAMES;
	}

	const rid = room?._id || Rooms.insert(roomInfo);

	if (members.length === 1) { // dm to yourself
		const user = Users.findOneById(members[0].userId);
		Subscriptions.upsert({ rid, 'c._id': members[0]._id }, {
			$set: { open: true },
			$setOnInsert: generateSubscription(members[0].name || members[0].username, members[0].username, user, members[0], members[0], { ...options.subscriptionExtra }),
		});
	} else {
		members.forEach((member) => {
			const otherMembers = sortedMembers.filter(({ _id }) => _id !== member._id);
			otherMembers.forEach(otherMember => {
				const otherUser = Users.findOneById(otherMember.userId);
				Subscriptions.upsert({ rid, 'c._id': otherMember._id }, {
					...options.creator === member._id && { $set: { open: true } },
					$setOnInsert: generateSubscription(
						member.username,
						member.username,
						otherUser,
						otherMember,
						member,
						{
							...options.subscriptionExtra,
							...options.creator !== member._id && { open: true },
						},
					),
				});
			})
		});
	}

	// If the room is new, run a callback
	if (isNewRoom) {
		const insertedRoom = Rooms.findOneById(rid);

		callbacks.run('afterCreateDirectRoom', insertedRoom, { members });

		Apps.triggerEvent('IPostRoomCreate', insertedRoom);
	}

	return {
		_id: rid,
		usernames,
		t: 'd',
		inserted: isNewRoom,
	};
};

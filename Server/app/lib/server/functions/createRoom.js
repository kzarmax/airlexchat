import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';
import s from 'underscore.string';

import { Apps } from '../../../apps/server';
import {addUserRoles, hasPermission} from '../../../authorization';
import { callbacks } from '../../../callbacks';
import { Rooms, Subscriptions, Users, Cards } from '../../../models';
import { getValidRoomName } from '../../../utils';
import { createDirectRoom } from './createDirectRoom';


export const createRoom = function(type, name, owner, members = [], readOnly, extraData = {}, options = {}) {
	callbacks.run('beforeCreateRoom', { type, name, owner, members, readOnly, extraData, options });

	if (type === 'd') {
		return createDirectRoom(members, extraData, options);
	}

	name = s.trim(name);
	owner = s.trim(owner);
	members = [].concat(members);

	if (!name) {
		throw new Meteor.Error('error-invalid-name', 'Invalid name', { function: 'RocketChat.createRoom' });
	}

	//owner = Users.findOneByUsernameIgnoringCase(owner, { fields: { username: 1 } });
	owner = Cards.findOneById(owner);

	if (!owner) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', { function: 'RocketChat.createRoom' });
	}

	if (!_.contains(members, owner._id)) {
		members.push(owner._id);
	}

	if (extraData.broadcast) {
		readOnly = true;
		delete extraData.reactWhenReadOnly;
	}

	const now = new Date();

	const validRoomNameOptions = {};

	if (options.nameValidationRegex) {
		validRoomNameOptions.nameValidationRegex = options.nameValidationRegex;
	}

	let room = {
		// 日本語名を許可
		//name: getValidRoomName(name, null, validRoomNameOptions),
		name,
		fname: name,
		t: type,
		msgs: 0,
		usersCount: 0,
		adhoc: false,
		u: {
			_id: owner._id,
			username: owner.username,
		},
		c: {
			_id: owner._id,
			username: owner.username,
		},
		...extraData,
		ts: now,
		ro: readOnly === true,
		sysMes: readOnly !== true,
	};

	room._USERNAMES = members;

	const prevent = Promise.await(Apps.triggerEvent('IPreRoomCreatePrevent', room).catch((error) => {
		if (error instanceof AppsEngineException) {
			throw new Meteor.Error('error-app-prevented', error.message);
		}

		throw error;
	}));

	if (prevent) {
		throw new Meteor.Error('error-app-prevented', 'A Rocket.Chat App prevented the room creation.');
	}

	let result;
	result = Promise.await(Apps.triggerEvent('IPreRoomCreateExtend', room));
	result = Promise.await(Apps.triggerEvent('IPreRoomCreateModify', result));

	if (typeof result === 'object') {
		Object.assign(room, result);
	}

	delete room._USERNAMES;

	if (type === 'c') {
		callbacks.run('beforeCreateChannel', owner, room);
	}

	room = Rooms.createWithFullRoomData(room);

	for (const cardId of members) {
		const card = Cards.findOneById(cardId);
		const member = Users.findOneById(card.userId);
		const isTheOwner = cardId === owner._id;
		if (!card) {
			continue;
		}

		// make all room members (Except the owner) muted by default, unless they have the post-readonly permission
		if (readOnly === true && !hasPermission(card.userId, 'post-readonly') && !isTheOwner) {
			Rooms.muteCardIdByRoomId(room._id, card._id);
		}

		const extra = options.subscriptionExtra || {};

		extra.open = true;

		if (room.prid) {
			extra.prid = room.prid;
		}

		if (isTheOwner) {
			extra.ls = now;
			extra.roles = ['owner'];
		}

		Subscriptions.createWithRoomAndUserAndCard(room, member, card, extra);
	}

	// TODO: カード？
	addUserRoles(owner.userId, ['owner'], room._id);

	if (type === 'c') {
		Meteor.defer(() => {
			callbacks.run('afterCreateChannel', owner, room);
		});
	} else if (type === 'p') {
		Meteor.defer(() => {
			callbacks.run('afterCreatePrivateGroup', owner, room);
		});
	}
	Meteor.defer(() => {
		callbacks.run('afterCreateRoom', owner, room);
	});

	Apps.triggerEvent('IPostRoomCreate', room);

	return {
		rid: room._id, // backwards compatible
		...room,
	};
};

import { Meteor } from 'meteor/meteor';

import { Subscriptions, Uploads, Users, Cards, Messages, Rooms } from '../../../models';
import { hasPermission } from '../../../authorization';
import { normalizeMessagesForUser } from '../../../utils/server/lib/normalizeMessagesForUser';
import { settings } from '../../../settings';
import { API } from '../api';
import { getDirectMessageByNameOrIdWithOptionToJoin } from '../../../lib/server/functions/getDirectMessageByNameOrIdWithOptionToJoin';
import {isFriend} from "../../../lib/server";

function findDirectMessageRoom(params, user) {
	if ((!params.roomId || !params.roomId.trim())
		&& (!params.username || !params.username.trim())
		&& (!params.cardId || !params.cardId.trim())
		&& (!params.friendCardId || !params.friendCardId.trim())
	) {
		throw new Meteor.Error('error-room-param-not-provided', 'Body param "cardId" and "friendCardId" or "roomId" is required');
	}

	const room = getDirectMessageByNameOrIdWithOptionToJoin({
		currentUserId: user._id,
		cardId: params.cardId,
		friendCardId: params.friendCardId,
		nameOrId: params.username || params.roomId || params.friendCardId,
		type: 'd'
	});

	const canAccess = Meteor.call('canAccessRoom', room._id, params.cardId);
	if (!canAccess || !room || room.t !== 'd') {
		throw new Meteor.Error('error-room-not-found', 'The required "cardId" and "friendCardId" or "roomId" param provided does not match any dirct message');
	}

	const card = Cards.findOneByIdAndUserId(params.cardId, user._id);
	if (!card) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const subscription = Subscriptions.findOneByRoomIdAndCardId(room._id, params.cardId);

	return {
		room,
		subscription,
	};
}

API.v1.addRoute(['dm.create', 'im.create'], { authRequired: true }, {
	post() {
		const { cardId, friendCardId } = this.requestParams();

		if (!isFriend(cardId, friendCardId)) {
			return API.v1.failure('Is Not friend');
		}

		const room = Meteor.call('createDirectMessage', cardId, friendCardId);

		return API.v1.success({
			room: { ...room, _id: room.rid },
		});
	},
});

API.v1.addRoute(['dm.close', 'im.close'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		if (!findResult.subscription.open) {
			return API.v1.failure(`The direct message room, ${ this.bodyParams.name }, is already closed to the sender`);
		}

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('hideRoom', findResult.room._id, findResult.subscription.c._id);
		});

		return API.v1.success();
	},
});

API.v1.addRoute(['dm.counters', 'im.counters'], { authRequired: true }, {
	get() {
		const access = hasPermission(this.userId, 'view-room-administration');
		const ruserId = this.requestParams().userId;
		let user = this.userId;
		let unreads = null;
		let userMentions = null;
		let unreadsFrom = null;
		let joined = false;
		let msgs = null;
		let latest = null;
		let members = null;
		let lm = null;

		if (ruserId) {
			if (!access) {
				return API.v1.unauthorized();
			}
			user = ruserId;
		}
		const rs = findDirectMessageRoom(this.requestParams(), { _id: user });
		const { room } = rs;
		const dm = rs.subscription;
		lm = room.lm ? room.lm : room._updatedAt;

		if (typeof dm !== 'undefined' && dm.open) {
			if (dm.ls && room.msgs) {
				unreads = dm.unread;
				unreadsFrom = dm.ls;
			}
			userMentions = dm.userMentions;
			joined = true;
		}

		if (access || joined) {
			msgs = room.msgs;
			latest = lm;
			members = room.usersCount;
		}

		return API.v1.success({
			joined,
			members,
			unreads,
			unreadsFrom,
			msgs,
			latest,
			userMentions,
		});
	},
});

API.v1.addRoute(['dm.files', 'im.files'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);
		const addUserObjectToEveryObject = (file) => {
			if (file.userId) {
				file = this.insertUserObject({ object: file, userId: file.userId });
			}
			return file;
		};

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { rid: findResult.room._id });

		const files = Uploads.find(ourQuery, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			files: files.map(addUserObjectToEveryObject),
			count: files.length,
			offset,
			total: Uploads.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute(['dm.history', 'im.history'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		let latestDate = new Date();
		if (this.queryParams.latest) {
			latestDate = new Date(this.queryParams.latest);
		}

		let oldestDate = undefined;
		if (this.queryParams.oldest) {
			oldestDate = new Date(this.queryParams.oldest);
		}

		const inclusive = this.queryParams.inclusive || false;

		let count = 20;
		if (this.queryParams.count) {
			count = parseInt(this.queryParams.count);
		}

		let offset = 0;
		if (this.queryParams.offset) {
			offset = parseInt(this.queryParams.offset);
		}

		const unreads = this.queryParams.unreads || false;

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getChannelHistory', {
				rid: findResult.room._id,
				cardId: findResult.subscription.c._id,
				latest: latestDate,
				oldest: oldestDate,
				inclusive,
				offset,
				count,
				unreads,
			});
		});

		if (!result) {
			return API.v1.unauthorized();
		}

		return API.v1.success(result);
	},
});

API.v1.addRoute(['dm.members', 'im.members'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const cursor = Subscriptions.findByRoomId(findResult.room._id, {
			sort: { 'c.username': sort && sort.username ? sort.username : 1 },
			skip: offset,
			limit: count,
		});

		const total = cursor.count();
		const members = cursor.fetch().map((s) => s.c && s.c._id);

		const cards = Cards.find({ _id: { $in: members } }, {
			fields: { _id: 1, userId: 1, username: 1, name: 1, status: 1, utcOffset: 1 },
			sort: { username:  sort && sort.username ? sort.username : 1 },
		}).fetch();

		return API.v1.success({
			members: cards,
			count: members.length,
			offset,
			total,
		});
	},
});

API.v1.addRoute(['dm.messages', 'im.messages'], { authRequired: true }, {
	get() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { rid: findResult.room._id });

		const messages = Messages.find(ourQuery, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			messages: normalizeMessagesForUser(messages, this.userId),
			count: messages.length,
			offset,
			total: Messages.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute(['dm.messages.others', 'im.messages.others'], { authRequired: true }, {
	get() {
		if (settings.get('API_Enable_Direct_Message_History_EndPoint') !== true) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', { route: '/api/v1/im.messages.others' });
		}

		if (!hasPermission(this.userId, 'view-room-administration')) {
			return API.v1.unauthorized();
		}

		const { roomId } = this.queryParams;
		if (!roomId || !roomId.trim()) {
			throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" is required');
		}

		const room = Rooms.findOneById(roomId);
		if (!room || room.t !== 'd') {
			throw new Meteor.Error('error-room-not-found', `No direct message room found by the id of: ${ roomId }`);
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		const ourQuery = Object.assign({}, query, { rid: room._id });

		const msgs = Messages.find(ourQuery, {
			sort: sort || { ts: -1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			messages: normalizeMessagesForUser(msgs, this.userId),
			offset,
			count: msgs.length,
			total: Messages.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute(['dm.list', 'im.list'], { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort = { name: 1 }, fields } = this.parseJsonQuery();

		// TODO: CACHE: Add Breacking notice since we removed the query param

		const cursor = Rooms.findBySubscriptionTypeAndUserId('d', this.userId, {
			sort,
			skip: offset,
			limit: count,
			fields,
		});

		const total = cursor.count();
		const rooms = cursor.fetch();

		return API.v1.success({
			ims: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
			offset,
			count: rooms.length,
			total,
		});
	},
});

API.v1.addRoute(['dm.list.everyone', 'im.list.everyone'], { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-room-administration')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const ourQuery = Object.assign({}, query, { t: 'd' });

		const rooms = Rooms.find(ourQuery, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			ims: rooms.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
			offset,
			count: rooms.length,
			total: Rooms.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute(['dm.open', 'im.open'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		if (!findResult.subscription.open) {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('openRoom', findResult.room._id, findResult.subscription.c._id);
			});
		}

		return API.v1.success();
	},
});

API.v1.addRoute(['dm.setTopic', 'im.setTopic'], { authRequired: true }, {
	post() {
		if (!this.bodyParams.hasOwnProperty('topic')) {
			return API.v1.failure('The bodyParam "topic" is required');
		}

		const findResult = findDirectMessageRoom(this.requestParams(), this.user);

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('saveRoomSettings', findResult.room._id, findResult.subscription.c._id, 'roomTopic', this.bodyParams.topic);
		});

		return API.v1.success({
			topic: this.bodyParams.topic,
		});
	},
});

API.v1.addRoute(['dm.delete', 'im.delete'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);
		console.log('dm.delete, im.delete: ', findResult);

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('eraseRoom', findResult.room._id);
		});

		return API.v1.success();
	},
});

API.v1.addRoute(['dm.leave', 'im.leave'], { authRequired: true }, {
	post() {
		const findResult = findDirectMessageRoom(this.requestParams(), this.user);
		console.log('dm.leave, im.leave: ', findResult);

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('leaveRoom', findResult.room._id, findResult.subscription.c._id);
		});

		return API.v1.success();
	},
});

import { Meteor } from 'meteor/meteor';

import { Subscriptions, Users } from '../../app/models/server';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';

function findUsers({ rid, status, skip, limit, filter = '' }) {
	// const options = {
	// 	fields: {
	// 		name: 1,
	// 		username: 1,
	// 		nickname: 1,
	// 		status: 1,
	// 		avatarETag: 1,
	// 	},
	// 	sort: {
	// 		statusConnection: -1,
	// 		[settings.get('UI_Use_Real_Name') ? 'name' : 'username']: 1,
	// 	},
	// 	...skip > 0 && { skip },
	// 	...limit > 0 && { limit },
	// };
	//
	// return Users.findByActiveUsersExcept(filter, undefined, options, undefined, [{
	// 	__rooms: rid,
	// 	...status && { status },
	// }]).fetch();
	return Subscriptions.model.rawCollection().aggregate([
		{ $match: { rid } },
		{
			$lookup:
				{
					from: 'rocketchat_cards',
					localField: 'c._id',
					foreignField: '_id',
					as: 'c',
				},
		},
		{
			$lookup:
				{
					from: 'users',
					localField: 'c.userId',
					foreignField: '_id',
					as: 'u',
				},
		},
		{
			$project: {
				'c._id': 1,
				// 'c.name': 1,
				'c.username': 1,
				'c._updatedAt' : 1,
				'u._id': 1,
				'u.status': 1,
				ts: 1,
				roles:1,
			},
		},
		...status ? [{ $match: { 'u.status': status } }] : [],
		{
			$sort: {
				[settings.get('UI_Use_Real_Name') ? 'u.name' : 'u.username']: 1,
			},
		},
		...skip > 0 ? [{ $skip: skip }] : [],
		...limit > 0 ? [{ $limit: limit }] : [],
		{
			$project: {
				_id: { $arrayElemAt: ['$c._id', 0] },
				userId: { $arrayElemAt: ['$u._id', 0] },
				// name: { $arrayElemAt: ['$c.name', 0] },
				username: { $arrayElemAt: ['$c.username', 0] },
				c_updatedAt: { $arrayElemAt: ['$c._updatedAt', 0] },
				status: { $arrayElemAt: ['$u.status', 0] },
				ts: 1,
				roles: 1,
				isOwner: {
					$cond: {
						if: { $isArray: '$roles' },
						then: { $in: ['owner', '$roles'] },
						else: false,
					},

				},
			},
		},
	]).toArray();
}

Meteor.methods({
	async getUsersOfRoom(rid, cardId, showAll, { limit, skip } = {}, filter) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, cardId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const total = Subscriptions.findByRoomIdWhenUsernameExists(rid).count();

		const users = await findUsers({ rid, status: !showAll ? { $ne: 'offline' } : undefined, limit, skip, filter });

		return {
			total,
			records: users,
		};
	},
});

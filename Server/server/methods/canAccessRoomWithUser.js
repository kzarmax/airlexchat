import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { Users, Rooms } from '../../app/models/server';
import { canAccessRoomWithUser } from '../../app/authorization/server';
import { settings } from '../../app/settings/server';

Meteor.methods({
	canAccessRoomWithUser(rid, userId, extraData) {
		check(rid, String);
		check(userId, Match.Maybe(String));

		let user;

		if (userId) {
			user = Users.findOneById(userId, {
				fields: {
					_id: 1,
					username: 1,
				},
			});

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'canAccessRoomWithUser',
				});
			}
		}

		if (!rid) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoomWithUser',
			});
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'canAccessRoomWithUser',
			});
		}

		if (canAccessRoomWithUser.call(this, room, user, extraData)) {
			// if (user) {
			// 	room.username = user.username;
			// }
			return room;
		}

		if (!userId && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'canAccessRoomWithUser',
			});
		}

		return false;
	},
});


import { Authorization } from '../../sdk';
import { RoomAccessWithUserValidator } from '../../sdk/types/IAuthorization';
import { Subscriptions, Rooms, Settings } from './service';

const roomAccessWithUserValidators: RoomAccessWithUserValidator[] = [
	async function(room, user): Promise<boolean> {
		if (!room?._id || room.t !== 'c') {
			return false;
		}

		if (!user?._id) {
			// TODO: it was using cached version from /app/settings/server/raw.js
			const anon = await Settings.getValueById('Accounts_AllowAnonymousRead');
			return !!anon;
		}

		return Authorization.hasPermission(user._id, 'view-c-room');
	},

	async function(room, user): Promise<boolean> {
		if (!room?._id || !user?._id) {
			return false;
		}
		if (await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id)) {
			return true;
		}
		return false;
	},

	async function(room, user): Promise<boolean> {
		if (!room?.prid) {
			return false;
		}
		const parentRoom = await Rooms.findOne(room.prid);
		if (!parentRoom) {
			return false;
		}
		return Authorization.canAccessRoomWithUser(parentRoom, user);
	}
];

export const canAccessRoomWithUser: RoomAccessWithUserValidator = async (room, user, extraData): Promise<boolean> => {
	// TODO livechat can send both as null, so they we need to validate nevertheless
	// if (!room || !user) {
	// 	return false;
	// }

	for await (const roomAccessWithUserValidator of roomAccessWithUserValidators) {
		if (await roomAccessWithUserValidator(room, user, extraData)) {
			return true;
		}
	}

	return false;
};


import { Authorization } from '../../sdk';
import { RoomAccessValidator } from '../../sdk/types/IAuthorization';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';
import { canAccessRoomTokenpass } from './canAccessRoomTokenpass';
import { Subscriptions, Rooms, Settings } from './service';

const roomAccessValidators: RoomAccessValidator[] = [
	async function(room, card): Promise<boolean> {
		if (!room?._id || room.t !== 'c') {
			return false;
		}

		if (!card?._id) {
			// TODO: it was using cached version from /app/settings/server/raw.js
			const anon = await Settings.getValueById('Accounts_AllowAnonymousRead');
			return !!anon;
		}

		return Authorization.hasPermission(card.userId??'', 'view-c-room');
	},

	async function(room, card): Promise<boolean> {
		if (!room?._id || !card?._id) {
			return false;
		}
		if (await Subscriptions.findOneByRoomIdAndCardId(room._id, card._id)) {
			return true;
		}
		return false;
	},

	async function(room, card): Promise<boolean> {
		if (!room?.prid) {
			return false;
		}
		const parentRoom = await Rooms.findOne(room.prid);
		if (!parentRoom) {
			return false;
		}
		return Authorization.canAccessRoom(parentRoom, card);
	},
	canAccessRoomLivechat,
	canAccessRoomTokenpass,
];

export const canAccessRoom: RoomAccessValidator = async (room, card, extraData): Promise<boolean> => {
	// TODO livechat can send both as null, so they we need to validate nevertheless
	// if (!room || !user) {
	// 	return false;
	// }

	for await (const roomAccessValidator of roomAccessValidators) {
		if (await roomAccessValidator(room, card, extraData)) {
			return true;
		}
	}

	return false;
};

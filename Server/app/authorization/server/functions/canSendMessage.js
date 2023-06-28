import { canAccessRoomAsync } from './canAccessRoom';
import { hasPermissionAsync } from './hasPermission';
import { Subscriptions, Rooms, Cards } from '../../../models/server/raw';
import { roomTypes, RoomMemberActions } from '../../../utils/server';
import {DisabledOptions} from "/app/utils/lib/RoomTypeConfig";

const subscriptionOptions = {
	projection: {
		blocked: 1,
		blocker: 1,
	},
};

export const validateRoomMessagePermissionsAsync = async (room, { uid, cardId, username, type, message_type }, extraData) => {
	if (!room) {
		throw new Error('error-invalid-room');
	}

	const card = await Cards.findOneById(cardId);
	if (type !== 'app' && !await canAccessRoomAsync(room, card, extraData)) {
		throw new Error('error-not-allowed');
	}

	if (roomTypes.getConfig(room.t).allowMemberAction(room, RoomMemberActions.BLOCK)) {
		const subscription = await Subscriptions.findOneByRoomIdAndCardId(room._id, cardId, subscriptionOptions);
		if (subscription && (subscription.blocked || subscription.blocker)) {
			throw new Error('room_is_blocked');
		}
	}

	// Check Card's Disabled Options
	if(room.t === 'd'){
		const otherCardId = room._id.replace(cardId, '').trim();
		const otherCard = await Cards.findOneById(otherCardId);
		if(message_type){
			if(message_type === 'jitsi_call_started'){
				if(card?.disabledOption && card.disabledOption[otherCardId]?.includes(DisabledOptions.OPTION_PHONE) ||
					otherCard?.disabledOption && otherCard.disabledOption[cardId]?.includes(DisabledOptions.OPTION_PHONE)){
					throw new Error('room_is_limited_for_phone');
				}
			} else if (message_type === 'jitsi_video_call_started') {
				if(card?.disabledOption && card.disabledOption[otherCardId]?.includes(DisabledOptions.OPTION_VIDEO) ||
					otherCard?.disabledOption && otherCard.disabledOption[cardId]?.includes(DisabledOptions.OPTION_VIDEO)){
					throw new Error('room_is_limited_for_video');
				}
			}
		} else if(card?.disabledOption && card.disabledOption[otherCardId]?.includes(DisabledOptions.OPTION_CHAT) ||
			otherCard?.disabledOption && otherCard.disabledOption[cardId]?.includes(DisabledOptions.OPTION_CHAT)){
			throw new Error('room_is_limited_for_chat');
		}
	}

	if (room.ro === true && !await hasPermissionAsync(uid, 'post-readonly', room._id)) {
		// Unless the user was manually unmuted
		if (!(room.unmuted || []).includes(cardId)) {
			throw new Error('You can\'t send messages because the room is readonly.');
		}
	}

	if ((room.muted || []).includes(cardId)) {
		throw new Error('You_have_been_muted');
	}
};

export const canSendMessageAsync = async (rid, { uid, cardId, username, type, message_type }, extraData) => {
	const room = await Rooms.findOneById(rid);
	await validateRoomMessagePermissionsAsync(room, { uid, cardId, username, type, message_type }, extraData);
	return room;
};

export const canSendMessage = (rid, { uid, cardId, username, type, message_type }, extraData) => Promise.await(canSendMessageAsync(rid, { uid, cardId, username, type, message_type }, extraData));
export const validateRoomMessagePermissions = (room, { uid, cardId, username, type, message_type }, extraData) => Promise.await(validateRoomMessagePermissionsAsync(room, { uid, cardId, username, type, message_type }, extraData));

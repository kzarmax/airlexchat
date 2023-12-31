import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Subscriptions, Messages } from '../../../models';
import { settings } from '../../../settings';
import { roomTypes, RoomSettingsEnum } from '../../../utils';

export const saveRoomType = function(rid, roomType, user, card, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomType',
		});
	}
	if (roomType !== 'c' && roomType !== 'p') {
		throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
			function: 'RocketChat.saveRoomType',
			type: roomType,
		});
	}
	const room = Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			function: 'RocketChat.saveRoomType',
			_id: rid,
		});
	}

	if (!roomTypes.getConfig(room.t).allowRoomSettingChange(room, RoomSettingsEnum.TYPE)) {
		throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
			function: 'RocketChat.saveRoomType',
		});
	}

	const result = Rooms.setTypeById(rid, roomType) && Subscriptions.updateTypeByRoomId(rid, roomType);
	if (result && sendMessage) {
		let message;
		if (roomType === 'c') {
			message = TAPi18n.__('Channel', {
				lng: (user && user.language) || settings.get('Language') || 'jp',
			});
		} else {
			message = TAPi18n.__('Private_Group', {
				lng: (user && user.language) || settings.get('Language') || 'jp',
			});
		}
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndCard('room_changed_privacy', rid, message, card);
	}
	return result;
};

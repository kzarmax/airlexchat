import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';

export const saveRoomDescription = function(rid, roomDescription, card) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			function: 'RocketChat.saveRoomDescription',
		});
	}

	const update = Rooms.setDescriptionById(rid, roomDescription);
	Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndCard('room_changed_description', rid, roomDescription, card);
	return update;
};

import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';

import { Rooms, Messages } from '../../../models';

export const saveRoomAnnouncement = function(rid, roomAnnouncement, card, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', { function: 'RocketChat.saveRoomAnnouncement' });
	}

	let message;
	let announcementDetails;
	if (typeof roomAnnouncement === 'string') {
		message = roomAnnouncement;
	} else {
		({ message, ...announcementDetails } = roomAnnouncement);
	}

	const updated = Rooms.setAnnouncementById(rid, message, announcementDetails);
	if (updated && sendMessage) {
		Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndCard('room_changed_announcement', rid, message, card);
	}

	return updated;
};

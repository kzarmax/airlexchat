import { Meteor } from 'meteor/meteor';

import { Rooms, Messages, Subscriptions, Integrations } from '../../../models';
import { roomTypes, getValidRoomName } from '../../../utils';
import { callbacks } from '../../../callbacks';

const updateRoomName = (rid, displayName, isDiscussion) => {
	if (isDiscussion) {
		return Rooms.setFnameById(rid, displayName) && Subscriptions.updateFnameByRoomId(rid, displayName);
	}
	const slugifiedRoomName = getValidRoomName(displayName, rid);
	return Rooms.setNameById(rid, slugifiedRoomName, displayName) && Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);
};

export const saveRoomName = function(rid, displayName, card, sendMessage = true) {
	const room = Rooms.findOneById(rid);
	if (roomTypes.getConfig(room.t).preventRenaming()) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			function: 'RocketChat.saveRoomdisplayName',
		});
	}
	const isChangedRoomName = displayName !== room.name;

	const slugifiedRoomName = displayName;

	if(isChangedRoomName){
		const update = Rooms.setNameById(rid, slugifiedRoomName, displayName) && Subscriptions.updateNameAndAlertByRoomId(rid, slugifiedRoomName, displayName);

		if (update && sendMessage) {
			Messages.createRoomRenamedWithRoomIdRoomNameAndCard(rid, displayName, card);
		}
		callbacks.run('afterRoomNameChange', { rid, name: displayName, oldName: room.name });
	}
	return displayName;
};

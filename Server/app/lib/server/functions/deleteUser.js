import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { FileUpload } from '../../../file-upload/server';
import {
	Users,
	Subscriptions,
	Messages,
	Rooms,
	Integrations,
	FederationServers,
	Cards,
	Friends
} from '../../../models/server';
import { settings } from '../../../settings/server';
import { updateGroupDMsName } from './updateGroupDMsName';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';
import { getSubscribedRoomsForUserWithDetails, shouldRemoveOrChangeOwner } from './getRoomsWithSingleOwner';
import { getUserSingleOwnedRooms } from './getUserSingleOwnedRooms';
import {deleteCard} from './deleteCard';
import { api } from '../../../../server/sdk/api';

export const deleteUser = function(userId, confirmRelinquish = false) {
	const user = Users.findOneById(userId, {
		fields: { _id: 1, username: 1, avatarOrigin: 1, federation: 1 },
	});

	if (!user) {
		return;
	}

	if (user.federation) {
		const existingSubscriptions = Subscriptions.find({ 'c.userId': user._id }).count();

		if (existingSubscriptions > 0) {
			throw new Meteor.Error('FEDERATION_Error_user_is_federated_on_rooms');
		}
	}

	const subscribedRooms = getSubscribedRoomsForUserWithDetails(userId);

	if (shouldRemoveOrChangeOwner(subscribedRooms) && !confirmRelinquish) {
		const rooms = getUserSingleOwnedRooms(subscribedRooms);
		throw new Meteor.Error('user-last-owner', '', rooms);
	}

	// Users without username can't do anything, so there is nothing to remove
	relinquishRoomOwnerships(userId, subscribedRooms);

	Cards.findByUserId(userId).forEach((card) => {

		const messageErasureType = settings.get('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				Messages.findFilesByCardId(card._id).forEach(function({ file }) {
					store.deleteById(file._id);
				});
				Messages.removeByCardId(card._id);
				break;
			case 'Unlink':
				const airlexChat = Users.findOneById('airlex.chat');
				const nameAlias = TAPi18n.__('Removed_User');
				Messages.unlinkCardId(card._id, airlexChat._id, airlexChat.username, nameAlias);
				break;
		}

		// Not Need in Airlex.Chat (Bug)
		//Rooms.updateGroupDMsRemovingUsernamesByUsername(card.username); // Remove direct rooms with the user
		//Rooms.removeDirectRoomContainingUsername(card.username); // Remove direct rooms with the user

		Subscriptions.removeByCardId(card._id); // Remove user subscriptions

		// removes user's avatar
		if (card.avatarOrigin === 'upload' || card.avatarOrigin === 'url') {
			FileUpload.getStore('Avatars').deleteByCardId(card._id);
			FileUpload.getStore('CardImages').deleteByName(card._id);
		}

		deleteCard(card._id);
	});


	Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
	api.broadcast('user.deleted', user);


	// Remove user from users database
	Users.removeById(userId);

	// update name and fname of group direct messages
	// updateGroupDMsName(user);

	// Refresh the servers list
	FederationServers.refreshServers();
};

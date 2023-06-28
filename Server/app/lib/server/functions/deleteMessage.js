import { Meteor } from 'meteor/meteor';

import { FileUpload } from '../../../file-upload/server';
import { settings } from '../../../settings/server';
import {Messages, Uploads, Rooms, Subscriptions} from '../../../models/server';
import { Notifications } from '../../../notifications/server';
import { callbacks } from '../../../callbacks/server';
import { Apps } from '../../../apps/server';
import {roomTypes} from "/app/utils";

export const deleteMessage = function(message, user, card) {
	const deletedMsg = Messages.findOneById(message._id);
	const keepHistory = settings.get('Message_KeepHistory');
	const showDeletedStatus = settings.get('Message_ShowDeletedStatus');

	if (deletedMsg && Apps && Apps.isLoaded()) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().messageEvent('IPreMessageDeletePrevent', deletedMsg));
		if (prevent) {
			throw new Meteor.Error('error-app-prevented-deleting', 'A Rocket.Chat App prevented the message deleting.');
		}
	}

	const room = Rooms.findOneById(message.rid, { fields: { lastMessage: 1, prid: 1, mid: 1, t:1, name: 1 } });
	const quoteMessages = Messages.find({
			rid: message.rid,
			'attachments.message_link': {$regex : `.*?msg=${ message._id }.*`}
			},
			{
				fields: {
					u: 1,
					c: 1,
					rid: 1,
					file: 1,
					ts: 1,
			},
		})
		.fetch();

	quoteMessages.forEach(quoteMessage => {
		deleteMessage(quoteMessage, user, card);
	});

	Messages.remove({ tmid: message._id, rid: message.rid });

	if (keepHistory) {
		if (showDeletedStatus) {
			Messages.cloneAndSaveAsHistoryById(message._id, user);
		} else {
			Messages.setHiddenById(message._id, true);
		}

		if (message.file && message.file._id) {
			Uploads.update(message.file._id, { $set: { _hidden: true } });
		}
	} else {

			if (!showDeletedStatus) {
				Messages.removeById(message._id);
			}

			if (message.file && message.file._id) {
				FileUpload.getStore('Uploads').deleteById(message.file._id);
			}

	}


	callbacks.run('afterDeleteMessage', deletedMsg, room, user);

	// update last message
	if (settings.get('Store_Last_Message')) {
		if (!room.lastMessage || room.lastMessage._id === message._id) {
			Rooms.resetLastMessageById(message.rid, message._id);
		}
	}

	// decrease message count
	Rooms.decreaseMessageCountById(message.rid, 1);

	// remove unread threads Subscriptions
	Subscriptions.removeUnreadThreadByRoomId(message.rid, message._id);

	if (showDeletedStatus) {
		Messages.setAsDeletedByIdAndCard(message._id, card);
	} else {
		Notifications.notifyRoom(message.rid, 'deleteMessage', { _id: message._id });
	}

	if (Apps && Apps.isLoaded()) {
		Apps.getBridges().getListenerBridge().messageEvent('IPostMessageDeleted', message);
	}
};

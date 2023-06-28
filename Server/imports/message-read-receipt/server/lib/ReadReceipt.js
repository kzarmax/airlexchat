import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { ReadReceipts, Subscriptions, Messages, Rooms, Users, LivechatVisitors, Cards } from '../../../../app/models';
import { settings } from '../../../../app/settings';
import { roomTypes } from '../../../../app/utils';
import { Notifications } from '/app/notifications';

const rawReadReceipts = ReadReceipts.model.rawCollection();

// debounced function by roomId, so multiple calls within 2 seconds to same roomId runs only once
const list = {};
const debounceByRoomId = function(fn) {
	return function(roomId, ...args) {
		clearTimeout(list[roomId]);
		list[roomId] = setTimeout(() => { fn.call(this, roomId, ...args); }, 2000);
	};
};

const updateMessages = debounceByRoomId(Meteor.bindEnvironment(({ _id, lm }, cardId) => {
	// @TODO maybe store firstSubscription in room object so we don't need to call the above update method
	const firstSubscription = Subscriptions.getMinimumLastSeenByRoomId(_id);
	if (!firstSubscription) {
		return;
	}

	Messages.setAsRead(_id, cardId, firstSubscription.ls);

	if (lm <= firstSubscription.ls) {
		Rooms.setLastMessageAsRead(_id, cardId);
	}
}));

export const ReadReceipt = {
	markMessagesAsRead(roomId, userId, cardId, userLastSeen) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		const room = Rooms.findOneById(roomId, { fields: { lm: 1, lastMessage: 1 } });

		// メッセージの既読にcardId追加
		Messages.setAsRead(room._id, cardId);
		Rooms.setLastMessageAsRead(room._id, cardId);

		// if users last seen is greadebounceByRoomIdter than room's last message, it means the user already have this room marked as read
		if (userLastSeen > room.lm) {
			return;
		}

		if (userLastSeen) {
			this.storeReadReceipts(Messages.findUnreadMessagesByRoomAndCardAndDate(roomId, cardId, userLastSeen), roomId, userId, cardId);
		}

		//updateMessages(room, cardId);
	},

	markMessageAsReadBySender(message, roomId, userId, cardId) {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}

		// this will usually happens if the message sender is the only one on the room
		const firstSubscription = Subscriptions.getMinimumLastSeenByRoomId(roomId);
		if (firstSubscription && message.unread && message.ts < firstSubscription.ls) {
			Messages.setAsReadById(message._id);
		}

		const room = Rooms.findOneById(roomId, { fields: { t: 1 } });
		const extraData = roomTypes.getConfig(room.t).getReadReceiptsExtraData(message);

		// messages.reads にcardIdが無いレコードすべて
		this.storeReadReceipts([{ _id: message._id }], roomId, userId, cardId, extraData);
	},

	async storeReadReceipts(messages, roomId, userId, cardId, extraData = {}) {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			const ts = new Date();
			const receipts = messages.map((message) => ({
				_id: Random.id(),
				roomId,
				userId,
				cardId,
				messageId: message._id,
				ts,
				...extraData,
			}));

			if (receipts.length === 0) {
				return;
			}

			try {
				await rawReadReceipts.insertMany(receipts);
			} catch (e) {
				console.error('Error inserting read receipts per card');
			}
		}
	},

	getReceipts(message) {
		return ReadReceipts.findByMessageId(message._id).map((receipt) => ({
			...receipt,
			user: receipt.token ? LivechatVisitors.getVisitorByToken(receipt.token, { fields: { username: 1, name: 1 } }) : Users.findOneById(receipt.userId, { fields: { username: 1, name: 1 } }),
			card: receipt.token ? LivechatVisitors.getVisitorByToken(receipt.token, { fields: { username: 1, name: 1 } }) : Cards.findOneById(receipt.cardId, { fields: { username: 1, name: 1 } }),
		}));
	},
};

import { ReadReceipt } from './lib/ReadReceipt';
import { callbacks } from '../../../app/callbacks';
import { Subscriptions } from '../../../app/models';

callbacks.add('afterSaveMessage', (message, room) => {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (room && !room.closedAt) {
		// set subscription as read right after message was sent
		Subscriptions.setAsReadByRoomIdAndCardId(room._id, message.c._id);
	}

	// mark message as read as well
	ReadReceipt.markMessageAsReadBySender(message, room._id, message.u._id, message.c._id);

	return message;
}, callbacks.priority.MEDIUM, 'message-read-receipt-afterSaveMessage');

callbacks.add('afterReadMessages', (rid, { userId, cardId, lastSeen }) => {
	ReadReceipt.markMessagesAsRead(rid, userId, cardId, lastSeen);
}, callbacks.priority.MEDIUM, 'message-read-receipt-afterReadMessages');

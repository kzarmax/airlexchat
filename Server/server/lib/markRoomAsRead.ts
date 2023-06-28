import { callbacks } from '../../app/callbacks/server';
import { NotificationQueue, Subscriptions } from '../../app/models/server/raw';

export async function markRoomAsRead(rid: string, uid: string, cardId: string): Promise<void> {
	callbacks.run('beforeReadMessages', rid, uid);

	const projection = { ls: 1, tunread: 1, alert: 1 };
	const sub = await Subscriptions.findOneByRoomIdAndCardId(rid, cardId, { projection });
	if (!sub) {
		throw new Error('error-invalid-subscription');
	}

	// do not mark room as read if there are still unread threads
	const alert = sub.alert && sub.tunread && sub.tunread.length > 0;

	await Subscriptions.setAsReadByRoomIdAndCardId(rid, cardId, alert);

	await NotificationQueue.clearQueueByUserId(uid);

	callbacks.runAsync('afterReadMessages', rid, { uid, cardId, lastSeen: sub.ls });
}

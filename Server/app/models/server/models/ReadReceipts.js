import { Base } from './_Base';

export class ReadReceipts extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({
			roomId: 1,
			userId: 1,
			messageId: 1,
		}, {
			unique: 1,
		});

		this.tryEnsureIndex({
			messageId: 1,
		});
	}

	findByMessageId(messageId) {
		return this.find({ messageId });
	}

	removeByRoomId(roomId) {
		const query = {
			roomId,
		};

		return this.remove(query);
	}

	removeByCardId(cardId) {
		const query = {
			cardId,
		};

		return this.remove(query);
	}

	removeByMessageId(messageId) {
		const query = {
			messageId,
		};

		return this.remove(query);
	}
}

export default new ReadReceipts('message_read_receipt');

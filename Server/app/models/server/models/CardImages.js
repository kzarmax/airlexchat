import _ from 'underscore';
import s from 'underscore.string';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { Base } from './_Base';

export class CardImages extends Base {
	constructor(...args) {
		super(...args);

		this.model.before.insert((cardId, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

		this.tryEnsureIndex({ userId: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ cardId: 1 }, { sparse: 1 });
	}

	insertImageFileInit(name, userId, cardId, store, file, extra) {
		const fileData = {
			_id: name,
			name,
			userId,
			cardId,
			store,
			complete: false,
			uploading: true,
			progress: 0,
			extension: s.strRightBack(file.name, '.'),
			uploadedAt: new Date(),
		};

		_.extend(fileData, file, extra);

		return this.insertOrUpsert(fileData);
	}

	updateFileComplete(fileId, cardId, file) {
		if (!fileId) {
			return;
		}

		const filter = {
			_id: fileId,
			cardId,
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
			},
		};

		update.$set = _.extend(file, update.$set);

		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		} else {
			return this.update(filter, update);
		}
	}

	findOneByCardId(cardId, options) {
		const query = { cardId };

		return this.findOne(query, options);
	}

	findOneByName(name) {
		return this.findOne({ name });
	}

	updateFileNameById(fileId, name) {
		const filter = { _id: fileId };
		const update = {
			$set: {
				name,
			},
		};
		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		} else {
			return this.update(filter, update);
		}
	}

	// @TODO deprecated
	updateFileCompleteByNameAndUserId(name, userId, url) {
		if (!name) {
			return;
		}

		const filter = {
			name,
			userId,
		};

		const update = {
			$set: {
				complete: true,
				uploading: false,
				progress: 1,
				url,
			},
		};

		if (this.model.direct && this.model.direct.update) {
			return this.model.direct.update(filter, update);
		} else {
			return this.update(filter, update);
		}
	}

	deleteFile(fileId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ _id: fileId });
		} else {
			return this.remove({ _id: fileId });
		}
	}

	deleteFileByUserId(userId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ userId });
		} else {
			return this.remove({ userId });
		}
	}


	deleteFileByCardId(cardId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ cardId });
		} else {
			return this.remove({ cardId });
		}
	}

}

export default new CardImages('card_images');

import _ from 'underscore';
import s from 'underscore.string';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { Base } from './_Base';

export class Avatars extends Base {
	constructor() {
		super('avatars');

		this.model.before.insert((cardId, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ cardId: 1 });
		this.tryEnsureIndex({ name: 1 }, { sparse: true });
		this.tryEnsureIndex({ rid: 1 }, { sparse: true });
	}

	insertAvatarFileInit(name, userId, cardId, store, file, extra) {
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
		}
		return this.update(filter, update);
	}

	findOneByCardId(cardId, options) {
		const query = { cardId };

		return this.findOne(query, options);
	}

	findOneByName(name) {
		return this.findOne({ name });
	}

	findOneByRoomId(rid) {
		return this.findOne({ rid });
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
		}
		return this.update(filter, update);
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
		}
		return this.update(filter, update);
	}

	deleteFile(fileId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ _id: fileId });
		}
		return this.remove({ _id: fileId });
	}

	deleteFileByUserId(userId) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ userId });
		} else {
			return this.remove({ userId });
		}
	}

	deleteFileByCardId(cardId) {
		// console.log('Avatars.deleteFileByCardId :', cardId);
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ cardId });
		} else {
			return this.remove({ cardId });
		}
	}

	deleteFileByRid(rid) {
		// console.log('Avatars.deleteFileByRid :', rid);
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ rid });
		} else {
			return this.remove({ rid });
		}
	}
}

export default new Avatars();

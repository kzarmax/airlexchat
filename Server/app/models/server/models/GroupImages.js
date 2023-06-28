// import _ from 'underscore';
// import s from 'underscore.string';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { Base } from './_Base';

export class GroupImages extends Base {
	constructor(...args) {
		super(...args);

		this.model.before.insert((rid, doc) => {
			doc.instanceId = InstanceStatus.id();
		});

		this.tryEnsureIndex({ cardId: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ rid: 1 }, { sparse: 1 });
	}

	findOneByCardId(cardId, options) {
		const query = { cardId };

		return this.findOne(query, options);
	}

	findOneByRoomId(rid, options) {
		return this.findOne({ rid }, options);
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

	deleteFileByRid(rid) {
		if (this.model.direct && this.model.direct.remove) {
			return this.model.direct.remove({ rid });
		} else {
			return this.remove({ rid });
		}
	}

}

export default new GroupImages('group_images');

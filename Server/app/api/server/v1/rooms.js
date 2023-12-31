import { Meteor } from 'meteor/meteor';
import Busboy from 'busboy';

import { FileUpload } from '../../../file-upload';
import { Rooms, Messages } from '../../../models';
import { API } from '../api';
import { findAdminRooms, findChannelAndPrivateAutocomplete, findAdminRoom } from '../lib/rooms';
import { sendFile, sendViaEmail } from '../../../../server/lib/channelExport';
import { canAccessRoom, hasPermission } from '../../../authorization/server';

function findRoomByIdOrName({ params, checkedArchived = true }) {
	if ((!params.roomId || !params.roomId.trim()) && (!params.roomName || !params.roomName.trim())) {
		throw new Meteor.Error('error-roomid-param-not-provided', 'The parameter "roomId" or "roomName" is required');
	}

	const fields = { ...API.v1.defaultFieldsToExclude };

	let room;
	if (params.roomId) {
		room = Rooms.findOneById(params.roomId, { fields });
	} else if (params.roomName) {
		room = Rooms.findOneByName(params.roomName, { fields });
	}
	if (!room) {
		throw new Meteor.Error('error-room-not-found', 'The required "roomId" or "roomName" param provided does not match any channel');
	}
	if (checkedArchived && room.archived) {
		throw new Meteor.Error('error-room-archived', `The channel, ${ room.name }, is archived`);
	}

	return room;
}

API.v1.addRoute('rooms.get', { authRequired: true }, {
	get() {
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-updatedSince-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
		}

		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('rooms/get', updatedSinceDate); });

		if (Array.isArray(result)) {
			result = {
				update: result,
				remove: [],
			};
		}

		return API.v1.success({
			update: result.update.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
			remove: result.remove.map((room) => this.composeRoomWithLastMessage(room, this.userId)),
		});
	},
});

API.v1.addRoute('rooms.members', { authRequired: true }, {
	get() {
		console.log('rooms.members', this.queryParams);

		const { cardId, showAll } = this.queryParams;
		const room = findRoomByIdOrName({ params: this.queryParams });
		if (!Meteor.call('canAccessRoom', room._id, cardId, {})) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}

		let result = {};
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getUsersOfRoom', room._id, cardId, showAll);
		});

		return API.v1.success(result);
	},
});

const getFiles = Meteor.wrapAsync(({ request }, callback) => {
	const busboy = new Busboy({ headers: request.headers });
	const files = [];

	const fields = {};


	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (fieldname !== 'file') {
			return callback(new Meteor.Error('invalid-field'));
		}

		const fileDate = [];
		file.on('data', (data) => fileDate.push(data));

		file.on('end', () => {
			files.push({ fieldname, file, filename, encoding, mimetype, fileBuffer: Buffer.concat(fileDate) });
		});
	});

	busboy.on('field', (fieldname, value) => { fields[fieldname] = value; });

	busboy.on('finish', Meteor.bindEnvironment(() => callback(null, { files, fields })));

	request.pipe(busboy);
});

API.v1.addRoute('rooms.upload/:rid/:cardId', { authRequired: true }, {
	post() {
		const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.urlParams.cardId);

		if (!room) {
			return API.v1.unauthorized();
		}


		const { files, fields } = getFiles({
			request: this.request,
		});

		if (files.length === 0) {
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			return API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid,
			cardId: this.urlParams.cardId,
			userId: this.userId,
		};

		const fileData = Meteor.runAsUser(this.userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			delete fields.description;

			Meteor.call('sendFileMessage', this.urlParams.rid, this.urlParams.cardId, null, null, uploadedFile, fields);

			return uploadedFile;
		});

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.upload/:rid/:cardId/:messageId', { authRequired: true }, {
	post() {
		const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.urlParams.cardId);

		if (!room) {
			return API.v1.unauthorized();
		}


		const { files, fields } = getFiles({
			request: this.request,
		});

		if (files.length === 0) {
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			return API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid,
			cardId: this.urlParams.cardId,
			userId: this.userId,
		};

		const fileData = Meteor.runAsUser(this.userId, () => {
			const fileStore = FileUpload.getStore('Uploads');
			const uploadedFile = fileStore.insertSync(details, file.fileBuffer);

			uploadedFile.description = fields.description;

			delete fields.description;

			Meteor.call('sendFileMessage', this.urlParams.rid, this.urlParams.cardId, this.urlParams.messageId, null, uploadedFile, fields);

			return uploadedFile;
		});

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.uploadthumbnail/:rid/:cardId', { authRequired: true }, {
	post() {
		const room = Meteor.call('canAccessRoom', this.urlParams.rid, this.urlParams.cardId);

		if (!room) {
			return API.v1.unauthorized();
		}

		const busboy = new Busboy({ headers: this.request.headers });
		const files = [];
		const fields = {};

		Meteor.wrapAsync((callback) => {
			busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
				if (fieldname !== 'file') {
					return callback(new Meteor.Error('invalid-field'));
				}

				const fileDate = [];
				file.on('data', (data) => fileDate.push(data));

				file.on('end', () => {
					files.push({ fieldname, file, filename, encoding, mimetype, fileBuffer: Buffer.concat(fileDate) });
				});
			});

			busboy.on('field', (fieldname, value) => { fields[fieldname] = value; });

			busboy.on('finish', Meteor.bindEnvironment(() => callback()));

			this.request.pipe(busboy);
		})();

		if (files.length === 0) {
			return API.v1.failure('File required');
		}

		if (files.length > 1) {
			return API.v1.failure('Just 1 file is allowed');
		}

		const file = files[0];

		const fileStore = FileUpload.getStore('Uploads');

		const details = {
			name: file.filename,
			size: file.fileBuffer.length,
			type: file.mimetype,
			rid: this.urlParams.rid,
			cardId: this.urlParams.cardId,
			userId: this.userId,
		};

		let uploadedFile, fileUrl = null;

		Meteor.runAsUser(this.userId, () => {
			uploadedFile = Meteor.wrapAsync(fileStore.insert.bind(fileStore))(details, file.fileBuffer);
			fileUrl = FileUpload.getPath(`${ uploadedFile._id }/${ encodeURI(uploadedFile.name) }`);
		});
		return API.v1.success({id:uploadedFile?uploadedFile._id:null, url:fileUrl});
	},
});

API.v1.addRoute('rooms.saveNotification', { authRequired: true }, {
	post() {
		const saveNotifications = (notifications, roomId, cardId) => {
			Object.keys(notifications).forEach((notificationKey) =>
				Meteor.runAsUser(this.userId, () =>
					Meteor.call('saveNotificationSettings', roomId, cardId, notificationKey, notifications[notificationKey]),
				),
			);
		};
		const { roomId, cardId, notifications } = this.bodyParams;

		if (!roomId) {
			return API.v1.failure('The \'roomId\' param is required');
		}
		if (!cardId) {
			return API.v1.failure('The \'cardId\' param is required');
		}

		if (!notifications || Object.keys(notifications).length === 0) {
			return API.v1.failure('The \'notifications\' param is required');
		}

		saveNotifications(notifications, roomId, cardId);

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.favorite', { authRequired: true }, {
	post() {
		const { cardId, favorite } = this.bodyParams;

		if (!this.bodyParams.hasOwnProperty('favorite')) {
			return API.v1.failure('The \'favorite\' param is required');
		}

		const room = findRoomByIdOrName({ params: this.bodyParams });

		Meteor.runAsUser(this.userId, () => Meteor.call('toggleFavorite', room._id, cardId, favorite));

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.cleanHistory', { authRequired: true }, {
	post() {
		const findResult = findRoomByIdOrName({ params: this.bodyParams });

		if (!this.bodyParams.latest) {
			return API.v1.failure('Body parameter "latest" is required.');
		}

		if (!this.bodyParams.oldest) {
			return API.v1.failure('Body parameter "oldest" is required.');
		}

		const latest = new Date(this.bodyParams.latest);
		const oldest = new Date(this.bodyParams.oldest);

		const inclusive = this.bodyParams.inclusive || false;

		Meteor.runAsUser(this.userId, () => Meteor.call('cleanRoomHistory', {
			roomId: findResult._id,
			latest,
			oldest,
			inclusive,
			limit: this.bodyParams.limit,
			excludePinned: [true, 'true', 1, '1'].includes(this.bodyParams.excludePinned),
			filesOnly: [true, 'true', 1, '1'].includes(this.bodyParams.filesOnly),
			ignoreThreads: [true, 'true', 1, '1'].includes(this.bodyParams.ignoreThreads),
			fromUsers: this.bodyParams.users,
		}));

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.info', { authRequired: true }, {
	get() {
		const room = findRoomByIdOrName({ params: this.requestParams() });
		const { fields } = this.parseJsonQuery();
		if (!Meteor.call('canAccessRoom', room._id, this.requestParams().cardId, {})) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}
		return API.v1.success({ room: Rooms.findOneByIdOrName(room._id, { fields }) });
	},
});

API.v1.addRoute('rooms.leave', { authRequired: true }, {
	post() {
		const room = findRoomByIdOrName({ params: this.bodyParams });
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('leaveRoom', room._id, this.bodyParams.cardId);
		});

		return API.v1.success();
	},
});

API.v1.addRoute('rooms.createDiscussion', { authRequired: true }, {
	post() {
		const { prid, pmid, reply, t_name, users } = this.bodyParams;
		if (!prid) {
			return API.v1.failure('Body parameter "prid" is required.');
		}
		if (!t_name) {
			return API.v1.failure('Body parameter "t_name" is required.');
		}
		if (users && !Array.isArray(users)) {
			return API.v1.failure('Body parameter "users" must be an array.');
		}

		const discussion = Meteor.runAsUser(this.userId, () => Meteor.call('createDiscussion', {
			prid,
			pmid,
			t_name,
			reply,
			users: users || [],
		}));

		return API.v1.success({ discussion });
	},
});

API.v1.addRoute('rooms.getDiscussions', { authRequired: true }, {
	get() {
		const room = findRoomByIdOrName({ params: this.requestParams() });
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();
		if (!Meteor.call('canAccessRoom', room._id, this.requestParams().cardId, {})) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}
		const ourQuery = Object.assign(query, { prid: room._id });

		const discussions = Rooms.find(ourQuery, {
			sort: sort || { fname: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			discussions,
			count: discussions.length,
			offset,
			total: Rooms.find(ourQuery).count(),
		});
	},
});

API.v1.addRoute('rooms.adminRooms', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort } = this.parseJsonQuery();
		const { types, filter } = this.requestParams();

		return API.v1.success(Promise.await(findAdminRooms({
			uid: this.userId,
			filter,
			types,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('rooms.adminRooms.getRoom', { authRequired: true }, {
	get() {
		const { rid } = this.requestParams();
		const room = Promise.await(findAdminRoom({
			uid: this.userId,
			rid,
		}));

		if (!room) {
			return API.v1.failure('not-allowed', 'Not Allowed');
		}
		return API.v1.success(room);
	},
});


API.v1.addRoute('rooms.autocomplete.channelAndPrivate', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;
		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findChannelAndPrivateAutocomplete({
			uid: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});

API.v1.addRoute('rooms.saveRoomSettings', { authRequired: true }, {
	post() {
		const { rid, cardId, ...params } = this.bodyParams;

		const result = Meteor.runAsUser(this.userId, () => Meteor.call('saveRoomSettings', rid, cardId, params));

		return API.v1.success({ rid: result.rid });
	},
});

API.v1.addRoute('rooms.changeArchivationState', { authRequired: true }, {
	post() {
		const { rid, action } = this.bodyParams;

		let result;
		if (action === 'archive') {
			result = Meteor.runAsUser(this.userId, () => Meteor.call('archiveRoom', rid));
		} else {
			result = Meteor.runAsUser(this.userId, () => Meteor.call('unarchiveRoom', rid));
		}

		return API.v1.success({ result });
	},
});

API.v1.addRoute('rooms.export', { authRequired: true }, {
	post() {
		const { rid, type } = this.bodyParams;

		if (!rid || !type || !['email', 'file'].includes(type)) {
			throw new Meteor.Error('error-invalid-params');
		}

		if (!hasPermission(this.userId, 'mail-messages', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Mailing is not allowed');
		}

		const room = Rooms.findOneById(rid);
		if (!room) {
			throw new Meteor.Error('error-invalid-room');
		}

		const user = Meteor.users.findOne({ _id: this.userId });

		if (!canAccessRoom(room, user)) {
			throw new Meteor.Error('error-not-allowed', 'Not Allowed');
		}

		if (type === 'file') {
			const { dateFrom, dateTo, format } = this.bodyParams;

			if (!['html', 'json'].includes(format)) {
				throw new Meteor.Error('error-invalid-format');
			}

			sendFile({
				rid,
				format,
				...dateFrom && { dateFrom: new Date(dateFrom) },
				...dateTo && { dateTo: new Date(dateTo) },
			}, user);
			return API.v1.success();
		}

		if (type === 'email') {
			const { toUsers, toEmails, subject, messages } = this.bodyParams;

			if ((!toUsers || toUsers.length === 0) && (!toEmails || toEmails.length === 0)) {
				throw new Meteor.Error('error-invalid-recipient');
			}

			if (messages.length === 0) {
				throw new Meteor.Error('error-invalid-messages');
			}

			const result = sendViaEmail({
				rid,
				toUsers,
				toEmails,
				subject,
				messages,
			}, user);

			return API.v1.success(result);
		}

		return API.v1.error();
	},
});

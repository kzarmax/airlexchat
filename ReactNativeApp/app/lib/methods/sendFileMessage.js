import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import FileUpload from '../../utils/fileUpload';
import database from '../database';
import log, {LOG_L_MIDDLE} from '../../utils/log';
import moment from "moment";
import { isAndroid } from '../../utils/deviceInfo';

const uploadQueue = {};

export function isUploadActive(path) {
	return !!uploadQueue[path];
}

export async function cancelUpload(item) {
	if (uploadQueue[item.path]) {
		try {
			await uploadQueue[item.path].cancel();
		} catch {
			// Do nothing
		}
		try {
			const db = database.active;
			await db.action(async() => {
				await item.destroyPermanently();
			});
		} catch (e) {
			log(e);
		}
		delete uploadQueue[item.path];
	}
}

export function sendFileMessage(rid, cardId, messageId, fileInfo, tmid, server, user) {
	return new Promise(async(resolve, reject) => {
		try {
			const { id, token } = user;

			// FolderStructure
			const uploadUrl = messageId?`${ server }/api/v1/rooms.upload/${ rid }/${ cardId }/${messageId}`
				:`${ server }/api/v1/rooms.upload/${ rid }/${ cardId }`;

			fileInfo.rid = rid;
			fileInfo.cardId = cardId;

			const db = database.active;
			const uploadsCollection = db.collections.get('uploads');
			let uploadRecord;
			try {
				uploadRecord = await uploadsCollection.find(fileInfo.path);
			} catch (error) {
				try {
					await db.action(async() => {
						uploadRecord = await uploadsCollection.create((u) => {
							u._raw = sanitizedRaw({ id: fileInfo.path }, uploadsCollection.schema);
							Object.assign(u, fileInfo);
							u.subscription.id = rid;
							u.messageId = messageId;
						});
					});
				} catch (e) {
					return log(e);
				}
			}

			const formData = [];
			formData.push({
				name: 'file',
				type: fileInfo.type,
				filename: fileInfo.name || 'fileMessage',
				uri: fileInfo.path
			});

			if (fileInfo.description) {
				formData.push({
					name: 'description',
					data: fileInfo.description
				});
			}

			if (tmid) {
				formData.push({
					name: 'tmid',
					data: tmid
				});
			}

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};

			uploadQueue[fileInfo.path] = FileUpload.fetch('POST', uploadUrl, headers, formData);

			uploadQueue[fileInfo.path].uploadProgress(async(loaded, total) => {
				try {
					await db.action(async() => {
						await uploadRecord.update((u) => {
							u.progress = Math.floor((loaded / total) * 100);
						});
					});
				} catch (e) {
					log(e);
				}
			});

			uploadQueue[fileInfo.path].then(async(response) => {
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) { // If response is all good...
					try {
						await db.action(async() => {
							await uploadRecord.destroyPermanently();
						});
						resolve(response);
					} catch (e) {
						log(e);
					}
				} else {
					try {
						await db.action(async() => {
							await uploadRecord.update((u) => {
								u.error = true;
							});
						});
					} catch (e) {
						log(e);
					}
					try {
						reject(response);
					} catch (e) {
						reject(e);
					}
				}
			});

			uploadQueue[fileInfo.path].catch(async(error) => {
				try {
					await db.action(async() => {
						await uploadRecord.update((u) => {
							u.error = true;
						});
					});
				} catch (e) {
					log(e);
				}
				reject(error);
			});
		} catch (e) {
			log(e);
		}
	});
}


export function uploadFile(rid, cardId, fileInfo, server, user) {
	return new Promise(async(resolve, reject) => {

		LOG_L_MIDDLE(`UploadFile ${rid}  ${cardId}`,  fileInfo, server, user);
		const { id, token } = user;

		const uploadUrl = `${ server }/api/v1/rooms.uploadthumbnail/${ rid }/${ cardId }`;

		try {
			const formData = [];
			formData.push({
				name: 'file',
				type: 'image/png',
				filename: fileInfo.name || 'thumbnail_' + moment().format('YYYYMMDDhhmmss'),
				uri: fileInfo.uri
			});

			const headers = {
				...RocketChatSettings.customHeaders,
				'Content-Type': 'multipart/form-data',
				'X-Auth-Token': token,
				'X-User-Id': id
			};


			uploadQueue[fileInfo.uri] = FileUpload.fetch('POST', uploadUrl, headers, formData);

			uploadQueue[fileInfo.uri].then(async(response) => {
				if (response.respInfo.status >= 200 && response.respInfo.status < 400) { // If response is all good...
					resolve(JSON.parse(isAndroid?response.data:response.respInfo.response));
				} else {
					reject(JSON.parse(isAndroid?response.data:response.respInfo.response));
				}
			});

			uploadQueue[fileInfo.uri].catch(async(error) => {
				reject(error);
			});
		} catch (e) {
			log(e, 'Upload Thumbnail Error');
		}
	});
}

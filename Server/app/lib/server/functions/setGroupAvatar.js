import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import {Messages, Rooms} from "/app/models";
import {api} from "/server/sdk/api";
// import { Cards } from '../../../models';
// import { Notifications } from '../../../notifications';

export const setGroupAvatar = function(rid, card, dataURI, contentType, service) {
	let encoding;
	let image;

	if (service === 'initials') {
		// return Cards.setGroupAvatar(card._id, service);
		return;
	} else if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ card.username }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ card.username }`, { function: 'RocketChat.setGroupAvatar', url: dataURI, username: card.username });
			}
		}

		if (result.statusCode !== 200) {
			console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setGroupAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setGroupAvatar', url: dataURI });
		}

		encoding = 'binary';
		image = result.content;
		contentType = result.headers['content-type'];
	} else if (service === 'rest') {
		encoding = 'binary';
		image = dataURI;
	} else {
		const fileData = RocketChatFile.dataURIParse(dataURI);
		encoding = 'base64';
		image = fileData.image;
		contentType = fileData.contentType;
	}

	const buffer = new Buffer(image, encoding);
	const fileStore = FileUpload.getStore('GroupImages');
	fileStore.deleteByRoomId(rid);

	const file = {
		userId: card.userId,
		cardId: card._id,
		rid,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, (err, result) => {
		if(err){
			throw new Meteor.Error('error_upload_group_avatar', `upload_file_failed`,{
				method: 'setGroupAvatar',
			});
		}
		else {
			Meteor.setTimeout(function() {
				Rooms.setAvatarData(rid, 'upload', result.etag);
				api.broadcast('room.avatarUpdate', { _id: rid, avatarETag: result.etag });
			}, 500);
		}
	});
};

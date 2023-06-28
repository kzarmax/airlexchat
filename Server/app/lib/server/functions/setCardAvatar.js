import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { RocketChatFile } from '../../../file';
import { FileUpload } from '../../../file-upload';
import { Cards } from '../../../models';
import {api} from "/server/sdk/api";

export const setCardAvatar = function(card, dataURI, contentType, service) {
	let encoding;
	let image;

	if (service === 'initials') {
		return Cards.setCardAvatar(card._id, service);
	} else if (service === 'url') {
		let result = null;

		try {
			result = HTTP.get(dataURI, { npmRequestOptions: { encoding: 'binary', rejectUnauthorized: false } });
		} catch (error) {
			if (!error.response || error.response.statusCode !== 404) {
				console.log(`Error while handling the setting of the avatar from a url (${ dataURI }) for ${ card.username }:`, error);
				throw new Meteor.Error('error-avatar-url-handling', `Error while handling avatar setting from a URL (${ dataURI }) for ${ card.username }`, { function: 'RocketChat.setCardAvatar', url: dataURI, username: card.username });
			}
		}

		if (result.statusCode !== 200) {
			console.log(`Not a valid response, ${ result.statusCode }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setCardAvatar', url: dataURI });
		}

		if (!/image\/.+/.test(result.headers['content-type'])) {
			console.log(`Not a valid content-type from the provided url, ${ result.headers['content-type'] }, from the avatar url: ${ dataURI }`);
			throw new Meteor.Error('error-avatar-invalid-url', `Invalid avatar URL: ${ dataURI }`, { function: 'RocketChat.setCardAvatar', url: dataURI });
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
	const fileStore = FileUpload.getStore('Avatars');
	fileStore.deleteByCardId(card._id);

	const file = {
		userId: card.userId,
		cardId: card._id,
		type: contentType,
		size: buffer.length,
	};

	fileStore.insert(file, buffer, (err, result) => {
		if(err){
			throw new Meteor.Error('error_upload_card_avatar', `upload_file_failed`,{
				method: 'setCardAvatar',
			});
		}
		else {
			Meteor.setTimeout(function () {
				Cards.setAvatarOrigin(card._id, service, result.etag);
				api.broadcast('card.avatarUpdate', { _id: card._id, avatarETag: result.etag });
			}, 500);
		}
	});
};

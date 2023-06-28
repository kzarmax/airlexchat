import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';

import {
	renderSVGLetters,
	serveAvatar,
	wasFallbackModified,
	setCacheAndDispositionHeaders,
} from './utils';
import { FileUpload } from '../../../app/file-upload';
import { Avatars } from '../../../app/models/server';

const defaultAvatarUrl = 'images/icon/default_avatar.png';
// request /avatar/@name forces returning the svg
export const userAvatar = Meteor.bindEnvironment(function(req, res, next) {
	const cardId = decodeURIComponent(req.url.substr(1).replace(/\?.*$/, ''));

	if (!cardId) {
		res.writeHead(404);
		res.end();
		return;
	}

	const avatarSize = req.query.size && parseInt(req.query.size);

	setCacheAndDispositionHeaders(req, res);

	// if request starts with @ always return the svg letters
	if (cardId[0] === '@') {
		const svg = renderSVGLetters(cardId.substr(1), avatarSize);
		serveAvatar(svg, req.query.format, res);
		return;
	}

	const reqModifiedHeader = req.headers['if-modified-since'];

	const file = Avatars.findOneByCardId(cardId);
	if (file) {
		res.setHeader('Content-Security-Policy', 'default-src \'none\'');

		if (reqModifiedHeader && reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}

		res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
		res.setHeader('Content-Type', file.type);
		res.setHeader('Content-Length', file.size);

		return FileUpload.get(file, req, res);
	}

	// if still using "letters fallback"
	if (!wasFallbackModified(reqModifiedHeader, res)) {
		res.writeHead(304);
		res.end();
		return;
	}

	req.url = `/${ defaultAvatarUrl }`;
	WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFilesByArch, req, res, next);
});

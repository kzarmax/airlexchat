import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';
import _ from 'underscore';
import { Cookies } from 'meteor/ostrio:cookies';
import { FileUpload } from '/app/file-upload';
import { Users, CardImages } from '/app/models';
import { settings } from '/app/settings';

const defaultUrl = 'images/icon/default_card.png';
const cookie = new Cookies();

function isUserAuthenticated(req) {
	const headers = req.headers || {};
	const query = req.query || {};

	let { rc_uid, rc_token } = query;

	if (!rc_uid && headers.cookie) {
		rc_uid = cookie.get('rc_uid', headers.cookie) ;
		rc_token = cookie.get('rc_token', headers.cookie);
	}

	if (!rc_uid || !rc_token || !Users.findOneByIdAndLoginToken(rc_uid, rc_token)) {
		return false;
	}

	return true;
}

const warnUnauthenticatedAccess = _.debounce(() => {
	console.warn('The server detected an unauthenticated access to an user avatar. This type of request will soon be blocked by default.');
}, 60000 * 30); // 30 minutes

function userCanAccessAvatar(req) {
	if (settings.get('Accounts_AvatarBlockUnauthenticatedAccess') === true) {
		return isUserAuthenticated(req);
	}

	if (!isUserAuthenticated(req)) {
		warnUnauthenticatedAccess();
	}

	return true;
}

export const cardAvatar = Meteor.bindEnvironment(function(req, res, next) {
	const params = {
		cardId: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')),
	};
	const cacheTime = req.query.cacheTime || settings.get('Accounts_AvatarCacheTime');

	if (_.isEmpty(params.cardId) || !userCanAccessAvatar(req)) {
		res.writeHead(403);
		res.write('Forbidden');
		res.end();
		return;
	}

	const match = /^\/([^?]*)/.exec(req.url);

	if (match[1]) {
		let cardId = decodeURIComponent(match[1]);
		let file;

		cardId = cardId.replace(/\.jpg$/, '');

		if (cardId[0] !== '@') {
			file = CardImages.findOneByCardId(cardId);

			if (file) {
				res.setHeader('Content-Security-Policy', 'default-src \'none\'');

				const reqModifiedHeader = req.headers['if-modified-since'];
				if (reqModifiedHeader && reqModifiedHeader === (file.uploadedAt && file.uploadedAt.toUTCString())) {
					res.setHeader('Last-Modified', reqModifiedHeader);
					res.writeHead(304);
					res.end();
					return;
				}

				res.setHeader('Cache-Control', `public, max-age=${ cacheTime }`);
				res.setHeader('Expires', '-1');
				res.setHeader('Content-Disposition', 'inline');
				if(file.uploadedAt)
					res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				return FileUpload.get(file, req, res);
			} else {
				req.url = `/${ defaultUrl }`;
				WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFilesByArch, req, res, next);
				return;
			}
		}
	}

	res.writeHead(404);
	res.end();
	return;
});

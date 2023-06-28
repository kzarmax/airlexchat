import { Meteor } from 'meteor/meteor';
import { WebAppInternals } from 'meteor/webapp';

import { FileUpload } from '../../../app/file-upload';
import { Rooms, Avatars, GroupImages } from '../../../app/models/server';

const getRoomAvatar = (roomId) => {
	const room = Rooms.findOneById(roomId, { fields: { t: 1, prid: 1, name: 1, fname: 1 } });
	if (!room) {
		return {};
	}

	const file = Avatars.findOneByRoomId(room._id);

	// if it is a discussion that doesn't have it's own avatar, returns the parent's room avatar
	if (room.prid && !file) {
		return getRoomAvatar(room.prid);
	}

	return { room, file };
};

const defaultGroupUrl = 'images/icon/default_group.png';

export const roomAvatar = Meteor.bindEnvironment(function(req, res, next) {
	const rid = decodeURIComponent(req.url.substr(1).replace(/\?.*$/, ''));

	if (!rid) {
		res.writeHead(404);
		res.end();
		return;
	}
	const file = GroupImages.findOneByRoomId(rid);

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (file) {
		res.setHeader('Content-Security-Policy', 'default-src \'none\'');

		if (reqModifiedHeader && reqModifiedHeader === file.uploadedAt?.toUTCString()) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}

		if (file.uploadedAt) {
			res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
		}
		res.setHeader('Content-Type', file.type);
		res.setHeader('Content-Length', file.size);

		return FileUpload.get(file, req, res);
	}

	req.url = `/${ defaultGroupUrl }`;
	WebAppInternals.staticFilesMiddleware(WebAppInternals.staticFilesByArch, req, res, next);
	return;
});

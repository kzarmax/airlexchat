import fs from 'fs';

import { Meteor } from 'meteor/meteor';
import { UploadFS } from 'meteor/jalik:ufs';
import _ from 'underscore';

import { settings } from '../../../settings';
import { FileUploadClass, FileUpload } from '../lib/FileUpload';
import stream from "stream";
import zlib from "zlib";
import util from "util";
import { Logger } from '/app/logger';

const logger = new Logger('FileUpload');

const FileSystemUploads = new FileUploadClass({
	name: 'FileSystem:Uploads',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${ encodeURIComponent(file.name) }`);
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type || 'application/octet-stream');
				res.setHeader('Content-Length', file.size);

				//this.store.getReadStream(file._id, file).pipe(res);
				return readFromGridFS(file.store, file._id, file, req, res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},

	copy(file, out) {
		const filePath = this.store.getFilePath(file._id, file);
		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(out);
			}
		} catch (e) {
			out.end();
		}
	},
});

const FileSystemAvatars = new FileUploadClass({
	name: 'FileSystem:Avatars',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

const FileSystemUserDataFiles = new FileUploadClass({
	name: 'FileSystem:UserDataFiles',

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);
				res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${ encodeURIComponent(file.name) }`);
				res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
				res.setHeader('Content-Type', file.type);
				res.setHeader('Content-Length', file.size);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
		}
	},
});

const FileSystemCardImages = new FileUploadClass({
	name: 'FileSystem:CardImages',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},
});

const FileSystemGroupImages = new FileUploadClass({
	name: 'FileSystem:GroupImages',
	// store setted bellow

	get(file, req, res) {
		const filePath = this.store.getFilePath(file._id, file);

		try {
			const stat = Meteor.wrapAsync(fs.stat)(filePath);

			if (stat && stat.isFile()) {
				file = FileUpload.addExtensionTo(file);

				this.store.getReadStream(file._id, file).pipe(res);
			}
		} catch (e) {
			res.writeHead(404);
			res.end();
			return;
		}
	},
});

function ExtractRange(options) {
	if (!(this instanceof ExtractRange)) {
		return new ExtractRange(options);
	}

	this.start = options.start;
	this.stop = options.stop;
	this.bytes_read = 0;

	stream.Transform.call(this, options);
}
util.inherits(ExtractRange, stream.Transform);


ExtractRange.prototype._transform = function(chunk, enc, cb) {
	if (this.bytes_read > this.stop) {
		// done reading
		this.end();
	} else if (this.bytes_read + chunk.length < this.start) {
		// this chunk is still before the start byte
	} else {
		let start;
		let stop;

		if (this.start <= this.bytes_read) {
			start = 0;
		} else {
			start = this.start - this.bytes_read;
		}
		if ((this.stop - this.bytes_read + 1) < chunk.length) {
			stop = this.stop - this.bytes_read + 1;
		} else {
			stop = chunk.length;
		}
		const newchunk = chunk.slice(start, stop);
		this.push(newchunk);
	}
	this.bytes_read += chunk.length;
	cb();
};


const getByteRange = function(header) {
	if (header) {
		const matches = header.match(/(\d+)-(\d+)/);
		if (matches) {
			return {
				start: parseInt(matches[1], 10),
				stop: parseInt(matches[2], 10),
			};
		}
	}
	return null;
};
const readFromGridFS = function(storeName, fileId, file, req, res) {
	const store = UploadFS.getStore(storeName);
	const rs = store.getReadStream(fileId, file);
	const ws = new stream.PassThrough();

	[rs, ws].forEach((stream) => stream.on('error', function(err) {
		store.onReadError.call(store, err, fileId, file);
		res.end();
	}));

	ws.on('close', function() {
		// Close output stream at the end
		ws.emit('end');
	});

	const accept = req.headers['accept-encoding'] || '';

	// Transform stream
	store.transformRead(rs, ws, fileId, file, req);
	const range = getByteRange(req.headers.range);
	let out_of_range = false;
	if (range) {
		out_of_range = (range.start > file.size) || (range.stop <= range.start) || (range.stop > file.size);
	}

	// Compress data using gzip
	if (accept.match(/\bgzip\b/) && range === null) {
		res.setHeader('Content-Encoding', 'gzip');
		res.removeHeader('Content-Length');
		res.writeHead(200);
		ws.pipe(zlib.createGzip()).pipe(res);
	} else if (accept.match(/\bdeflate\b/) && range === null) {
		// Compress data using deflate
		res.setHeader('Content-Encoding', 'deflate');
		res.removeHeader('Content-Length');
		res.writeHead(200);
		ws.pipe(zlib.createDeflate()).pipe(res);
	} else if (range && out_of_range) {
		// out of range request, return 416
		res.removeHeader('Content-Length');
		res.removeHeader('Content-Type');
		res.removeHeader('Content-Disposition');
		res.removeHeader('Last-Modified');
		res.setHeader('Content-Range', `bytes */${ file.size }`);
		res.writeHead(416);
		res.end();
	} else if (range) {
		res.setHeader('Content-Range', `bytes ${ range.start }-${ range.stop }/${ file.size }`);
		res.removeHeader('Content-Length');
		res.setHeader('Content-Length', range.stop - range.start + 1);
		res.writeHead(206);
		logger.debug('File upload extracting range');
		ws.pipe(new ExtractRange({ start: range.start, stop: range.stop })).pipe(res);
	} else {
		res.writeHead(200);
		ws.pipe(res);
	}
};

const createFileSystemStore = _.debounce(function() {
	const options = {
		path: settings.get('FileUpload_FileSystemPath'), // '/tmp/uploads/photos',
	};

	FileSystemUploads.store = FileUpload.configureUploadsStore('Local', FileSystemUploads.name, options);
	FileSystemAvatars.store = FileUpload.configureUploadsStore('Local', FileSystemAvatars.name, options);
	FileSystemCardImages.store = FileUpload.configureUploadsStore('Local', FileSystemCardImages.name, options);
	FileSystemGroupImages.store = FileUpload.configureUploadsStore('Local', FileSystemGroupImages.name, options);
	FileSystemUserDataFiles.store = FileUpload.configureUploadsStore('Local', FileSystemUserDataFiles.name, options);

	// DEPRECATED backwards compatibililty (remove)
	UploadFS.getStores().fileSystem = UploadFS.getStores()[FileSystemUploads.name];
}, 500);

settings.get('FileUpload_FileSystemPath', createFileSystemStore);

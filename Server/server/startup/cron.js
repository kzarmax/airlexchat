import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { SyncedCron } from 'meteor/littledata:synced-cron';

import { Logger } from '../../app/logger';
import { getWorkspaceAccessToken } from '../../app/cloud/server';
import { statistics } from '../../app/statistics';
import { settings } from '../../app/settings';
import {Messages, Uploads} from "/app/models";
import {FileUpload} from "/app/file-upload";

const logger = new Logger('SyncedCron');

SyncedCron.config({
	logger(opts) {
		return logger[opts.level].call(logger, opts.message);
	},
	collectionName: 'rocketchat_cron_history',
});

function generateStatistics() {
	const cronStatistics = statistics.save();

	cronStatistics.host = Meteor.absoluteUrl();

	if (settings.get('Statistics_reporting')) {
		try {
			const headers = {};
			const token = getWorkspaceAccessToken();

			if (token) {
				headers.Authorization = `Bearer ${ token }`;
			}

			HTTP.post('https://collector.rocket.chat/', {
				data: cronStatistics,
				headers,
			});
		} catch (error) {
			/* error*/
			logger.warn('Failed to send usage report');
		}
	}
}

function cleanupOEmbedCache() {
	return Meteor.call('OEmbedCacheCleanup');
}

function cleanupOldUploadFiles(){
	const query = {
		uploadedAt : {
			$lt:  new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
		}
	};
	const oldUploads = Uploads.find(query);

	let completed_count = 0;
	let error_count = 0;
	oldUploads.forEach(upload => {
		try {
			const fileID = upload._id;
			const msg = Messages.getMessageByFileId(fileID);

			if (msg) {
				Messages.removeById(msg._id);
			}

			FileUpload.getStore('Uploads').deleteById(fileID);
			completed_count++;
		} catch (error) {
			/* error*/
			error_count++;
			logger.warn(`Failed to clean old uploaded files File => _id: ${upload._id}, store: ${upload.store}, rid: ${upload.rid}, cardId: ${upload.cardId}, userId: ${upload.userId}`);
		}
	});
	logger.log(`Start cleaning old upload files All : ${completed_count + error_count}   Completed: ${completed_count}  Failed: ${error_count}`);
}

const name = 'Generate and save statistics';

Meteor.startup(function() {
	return Meteor.defer(function() {
		let TroubleshootDisableStatisticsGenerator;
		settings.get('Troubleshoot_Disable_Statistics_Generator', (key, value) => {
			if (TroubleshootDisableStatisticsGenerator === value) { return; }
			TroubleshootDisableStatisticsGenerator = value;

			if (value) {
				return SyncedCron.remove(name);
			}

			generateStatistics();

			SyncedCron.add({
				name,
				schedule(parser) {
					return parser.cron('12 * * * *');
				},
				job: generateStatistics,
			});
		});

		SyncedCron.add({
			name: 'Cleanup OEmbed cache',
			schedule(parser) {
				return parser.cron('24 2 * * *');
			},
			job: cleanupOEmbedCache,
		});

		// cleanup upload files in database every day 1:50
		SyncedCron.add({
			name: 'Cleanup Uploaded Files In Database',
			schedule(parser) {
				return parser.cron('50 1 ? * *');
			},
			job: cleanupOldUploadFiles,
		});

		return SyncedCron.start();
	});
});

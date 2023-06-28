import URL from 'url';
import QueryString from 'querystring';

import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { Messages } from '../../models';
import { settings } from '../../settings';
import { callbacks } from '../../callbacks';
import { getUserAvatarURL } from '../../utils/lib/getUserAvatarURL';

const recursiveRemove = (message, deep = 1) => {
	if (message) {
		if ('attachments' in message && message.attachments !== null && deep < settings.get('Message_QuoteChainLimit')) {
			message.attachments.map((msg) => recursiveRemove(msg, deep + 1));
		} else {
			delete message.attachments;
		}
	}
	return message;
};

callbacks.add('beforeSaveMessage', (msg) => {
	if (msg && msg.urls) {
		msg.urls.forEach((item) => {
			if (item.url.indexOf(Meteor.absoluteUrl()) === 0) {
				const urlObj = URL.parse(item.url);
				if (urlObj.query) {
					const queryString = QueryString.parse(urlObj.query);
					if (_.isString(queryString.msg)) { // Jump-to query param
						const jumpToMessage = recursiveRemove(Messages.findOneById(queryString.msg));
						if (jumpToMessage) {
							msg.attachments = msg.attachments || [];

							let message_link = item.url;
							if(queryString.txt){
								message_link = message_link.replace(`&txt=${QueryString.txt}`, '').trim();
							}

							const index = msg.attachments.findIndex((a) => a.message_link === message_link);
							if (index > -1) {
								msg.attachments.splice(index, 1);
							}
							msg.attachments.push({
								text: queryString.txt?decodeURIComponent(queryString.txt):jumpToMessage.msg,
								translations: jumpToMessage.translations,
								author_id: jumpToMessage.c._id,
								author_name: jumpToMessage.alias || jumpToMessage.c.username,
								author_icon: getUserAvatarURL(jumpToMessage.c.username),
								message_link,
								attachments: jumpToMessage.attachments || [],
								ts: jumpToMessage.ts,
							});
							item.ignoreParse = true;
						}
					}
				}
			}
		});
	}
	return msg;
}, callbacks.priority.LOW, 'jumpToMessage');

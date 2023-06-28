import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import {Cards, Messages} from '../../app/models';

Meteor.methods({
	deleteAttachment({ messageId, cardId, fileLink }) {
		check(messageId, String);
		check(cardId, String);
		check(fileLink, String);

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteAttachment',});
		}

		const message = Messages.findOneById(messageId);
		if (!message || message.attachments.length < 2) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteAttachment' });
		}

		const room = Meteor.call('canAccessRoom', message.rid, cardId);
		if (!room) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'deleteAttachment' });
		}

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'deleteAttachment' });
		}

		const attachments = message.attachments.filter(file => file.title_link !== fileLink);
		Messages.setMessageAttachments(messageId, attachments);
	},
});

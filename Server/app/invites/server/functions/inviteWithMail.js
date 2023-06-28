import { Meteor } from 'meteor/meteor';
import * as Mailer from "/app/mailer";
import {settings} from "/app/settings";

export const inviteWithMail = (email) => {
	if (!email) {
		throw new Meteor.Error('error-invalid-email', 'Invalid email', { method: 'inviteWithMail' });
	}

	const subject = settings.get('Invitation_Subject');

	let html = '';
	Mailer.getTemplate('Invitation_Email', (value) => {
		html = value;
	});

	try {
		const emailTemplate = {
			to: email,
			from: `${ settings.get('Site_Name') } <${ settings.get('From_Email') }>`,
			subject,
			html,
			data: {
				email,
			},
		};

		Mailer.send(emailTemplate);
	} catch (error) {
		throw new Meteor.Error('error-email-send-failed', 'Error trying to send email: ' + error.message, { method: 'inviteWithMail', message: error.message });
	}

	return true;
};

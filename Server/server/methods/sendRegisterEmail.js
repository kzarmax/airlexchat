import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import s from 'underscore.string';
import * as Mailer from '../../app/mailer';
import { Users } from '../../app/models';
import { settings } from '../../app/settings';

let verifyEmailTemplate = '';
Meteor.startup(() => {
	Mailer.getTemplateWrapped('Verification_Email', (value) => {
		verifyEmailTemplate = value;
	});
});

Meteor.methods({
	sendRegisterEmail(to) {
		check(to, String);

		let email = to.trim();

		const user = Users.findOneByEmailAddress(email);

		if (!user) {
			return false;
		}

		const regex = new RegExp(`^${ s.escapeRegExp(email) }$`, 'i');
		email = (user.emails || []).map((item) => item.address).find((userEmail) => regex.test(userEmail));

		try {
			const subject = Mailer.replace(settings.get('Verification_Email_Subject'));

			Accounts.emailTemplates.verifyEmail.subject = () => subject;
			Accounts.emailTemplates.verifyEmail.html = (userModel, url) => Mailer.replace(Mailer.replacekey(verifyEmailTemplate, 'Verification_Url', url), userModel);

			return Accounts.sendVerificationEmail(user._id, email);
		} catch (error) {
			throw new Meteor.Error('error-email-send-failed', `Error trying to send email: ${ error.message }`, {
				method: 'sendRegisterEmail',
				message: error.message,
			});
		}
	},
});

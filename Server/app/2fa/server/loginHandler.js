import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { OAuth } from 'meteor/oauth';
import { check } from 'meteor/check';

import { callbacks } from '../../callbacks';
import { checkCodeForUser } from './code/index';
import {settings} from "/app/settings";

Accounts.registerLoginHandler('totp', function(options) {
	if (!options.totp || !options.totp.code) {
		return;
	}

	return Accounts._runLoginHandlers(this, options.totp.login);
});

callbacks.add('onValidateLogin', (login) => {
	const { totp, oauth } = login.methodArguments[0];

	if (login.type === 'resume' || login.type === 'proxy' || login.methodName === 'resetPassword' || oauth || !settings.get('Accounts_TwoFactorAuthentication_By_Email_Enabled')) {
		return login;
	}

	// Force Two FactorAuthentication By Email
	checkCodeForUser({ user: login.user, code: totp && totp.code, options: { disablePasswordFallback: true }, method: 'email' });

	return login;
}, callbacks.priority.MEDIUM, '2fa');

const recreateError = (errorDoc) => {
	let error;

	if (errorDoc.meteorError) {
		error = new Meteor.Error();
		delete errorDoc.meteorError;
	} else {
		error = new Error();
	}

	Object.getOwnPropertyNames(errorDoc).forEach((key) => {
		error[key] = errorDoc[key];
	});
	return error;
};

OAuth._retrievePendingCredential = function(key, ...args) {
	const credentialSecret = args.length > 0 && args[0] !== undefined ? args[0] : null;
	check(key, String);

	const pendingCredential = OAuth._pendingCredentials.findOne({
		key,
		credentialSecret,
	});

	if (!pendingCredential) {
		return;
	}

	if (pendingCredential.credential.error) {
		OAuth._pendingCredentials.remove({
			_id: pendingCredential._id,
		});
		return recreateError(pendingCredential.credential.error);
	}

	// Work-around to make the credentials reusable for 2FA
	const future = new Date();
	future.setMinutes(future.getMinutes() + 2);

	OAuth._pendingCredentials.update({
		_id: pendingCredential._id,
	}, {
		$set: {
			createdAt: future,
		},
	});

	return OAuth.openSecret(pendingCredential.credential);
};

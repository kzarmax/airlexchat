import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { settings } from '../../../settings';
import { checkUsernameBlocked } from '../functions';
import { RateLimiter } from '../lib';

Meteor.methods({
	checkUsernameBlocked(username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setCardUsername' });
		}

		const user = Meteor.user();

		if (user.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setCardUsername' });
		}

		if (user.username === username) {
			return true;
		}
		return checkUsernameBlocked(username);
	},
});

RateLimiter.limitMethod('checkUsernameBlocked', 1, 1000, {
	userId() { return true; },
});

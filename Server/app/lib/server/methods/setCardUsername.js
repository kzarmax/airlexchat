import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { settings } from '../../../settings';
import { Cards } from '../../../models';
// import { callbacks } from '../../../callbacks';
import { setCardUsername, checkUsernameBlocked } from '../functions';
import { RateLimiter } from '../lib';
import _ from 'underscore';

Meteor.methods({
	setCardUsername(cardId, username) {
		check(username, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'setCardUsername' });
		}

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setCardUsername',
			});
		}

		if (card.username && !settings.get('Accounts_AllowUsernameChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'setCardUsername' });
		}

		if (card.username === username) {
			return username;
		}

		let nameValidation;
		try {
			nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
		} catch (error) {
			nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
		}

		if (!nameValidation.test(username)) {
			throw new Meteor.Error('username-invalid', `${ _.escape(username) } is not a valid username, use only letters, numbers, dots, hyphens and underscores`);
		}

		if (checkUsernameBlocked(username)) {
			throw new Meteor.Error('error-field-unavailable', `<strong>${ _.escape(username) }</strong> is blocked`, { method: 'setCardUsername', field: username });
		}

		if (!setCardUsername(card._id, username)) {
			throw new Meteor.Error('error-could-not-change-username', 'Could not change username', { method: 'setCardUsername' });
		}

		// if (!user.username) {
		// 	Meteor.runAsUser(user._id, () => Meteor.call('joinDefaultChannels', joinDefaultChannelsSilenced));
		// 	Meteor.defer(function() {
		// 		return callbacks.run('afterCreateUser', Users.findOneById(user._id));
		// 	});
		// }

		return username;
	},
});

RateLimiter.limitMethod('setCardUsername', 1, 1000, {
	userId() { return true; },
});

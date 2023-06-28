import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { settings } from '/app/settings';
import { setCardImage } from '/app/lib';
import {Cards, Subscriptions} from '/app/models';

Meteor.methods({
	setCardImageFromService(cardId, dataURI, contentType, service) {
		check(cardId, String);
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setCardImageFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setCardImageFromService',
			});
		}

		const card = Cards.findOneById(cardId);

		setCardImage(card, dataURI, contentType, service);

		return Subscriptions.setCardAvatarUpdatedByCardId(card._id);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setCardImageFromService',
	userId() {
		return true;
	},
}, 1, 5000);

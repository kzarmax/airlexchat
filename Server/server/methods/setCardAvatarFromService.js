import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { settings } from '/app/settings';
import { setCardAvatar } from '/app/lib';
import {Cards, Subscriptions} from '/app/models';

Meteor.methods({
	setCardAvatarFromService(cardId, dataURI, contentType, service) {
		check(cardId, String);
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setCardAvatarFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setCardAvatarFromService',
			});
		}

		const card = Cards.findOneById(cardId);

		setCardAvatar(card, dataURI, contentType, service);

		return Subscriptions.setRoomAvatarUpdatedByCardId(card._id);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setCardAvatarFromService',
	userId() {
		return true;
	},
}, 1, 5000);

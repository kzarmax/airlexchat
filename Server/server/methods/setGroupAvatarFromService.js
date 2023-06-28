import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { settings } from '/app/settings';
import { setGroupAvatar } from '/app/lib';
import {Cards, Rooms, Subscriptions} from '/app/models';

Meteor.methods({
	setGroupAvatarFromService(rid, cardId, dataURI, contentType, service) {
		check(rid, String);
		check(cardId, String);
		check(dataURI, String);
		check(contentType, Match.Optional(String));
		check(service, Match.Optional(String));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setGroupAvatarFromService',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setGroupAvatarFromService',
			});
		}

		if (!Meteor.call('canAccessRoom', rid, cardId, {})) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setGroupAvatarFromService',
			});
		}

		const card = Cards.findOneById(cardId);
		const subscription = Subscriptions.findOneByRoomIdAndCardIdAndRoles(rid, cardId, ['owner']);
		if (!subscription) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setGroupAvatarFromService',
			});
		}

		setGroupAvatar(rid, card, dataURI, contentType, service);

		return Subscriptions.setAvatarUpdatedByRoomId(rid);
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'setGroupAvatarFromService',
	userId() {
		return true;
	},
}, 1, 5000);

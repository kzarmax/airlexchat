import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { FileUpload } from '/app/file-upload';
import { Cards } from '/app/models';
import { settings } from '/app/settings';
import { Notifications } from '/app/notifications';
import {api} from "/server/sdk/api";

Meteor.methods({
	resetCardAvatar(cardId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetCardAvatar',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetCardAvatar',
			});
		}

		const card = Cards.findOneById(cardId);
		FileUpload.getStore('Avatars').deleteByCardId(card._id);
		Cards.unsetAvatarOrigin(card._id);
		api.broadcast('card.avatarUpdate', { _id: card._id, avatarETag: null });
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetCardAvatar',
	userId() {
		return true;
	},
}, 1, 60000);

import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { FileUpload } from '/app/file-upload';
import { Cards } from '/app/models';
import { settings } from '/app/settings';
// import { Notifications } from '/app/notifications';

Meteor.methods({
	resetCardImage(cardId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'resetCardImage',
			});
		}

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'resetCardImage',
			});
		}

		const card = Cards.findOneById(cardId);
		FileUpload.getStore('CardImages').deleteByCardId(card._id);
		Cards.unsetImageOrigin(card._id);
		api.broadcast('card.imageUpdate', { _id: card._id, avatarETag: null });	
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'resetCardImage',
	userId() {
		return true;
	},
}, 1, 60000);

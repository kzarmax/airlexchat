import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions, Cards } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { settings } from '../../app/settings';
import { loadMessageHistory } from '../../app/lib';

Meteor.methods({
	loadHistory(rid, end, limit = 20, ls) {
		check(rid, String);

		if (!Meteor.userId() && settings.get('Accounts_AllowAnonymousRead') === false) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'loadHistory',
			});
		}

		// todo Check Card
		const fromId = Meteor.userId();
		const cards = Cards.findByUserId(fromId).fetch();
		if(!cards || cards.length === 0)
			return false;
		const cardId = cards[0]._id;
		const room = Meteor.call('canAccessRoom', rid, cardId);

		if (!room) {
			return false;
		}

		const canAnonymous = settings.get('Accounts_AllowAnonymousRead');
		const canPreview = hasPermission(fromId, 'preview-c-room');

		if (room.t === 'c' && !canAnonymous && !canPreview && !Subscriptions.findOneByRoomIdAndCardId(rid, cardId, { fields: { _id: 1 } })) {
			return false;
		}

		return loadMessageHistory({ userId: fromId, rid, end, limit, ls });
	},
});

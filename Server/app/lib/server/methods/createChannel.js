import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { createRoom } from '../functions';

Meteor.methods({
	createChannel(name, cardId, members, readOnly = false, customFields = {}, extraData = {}) {
		check(name, String);
		check(cardId, String);
		check(members, Match.Optional([String]));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'createChannel' });
		}

		if (!hasPermission(Meteor.userId(), 'create-c')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'createChannel' });
		}
		return createRoom('c', name, cardId, members, readOnly, { customFields, ...extraData });
	},
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { settings } from '../../app/settings/server';
import { Messages, Rooms, Cards } from '../../app/models/server';
import { canAccessRoom } from '../../app/authorization/server';
import { readThread } from '../../app/threads/server/functions';

Meteor.methods({
	readThreads(tmid, cardId) {
		check(tmid, String);
		check(cardId, String);

		if (!Meteor.userId() || !settings.get('Threads_enabled')) {
			throw new Meteor.Error('error-not-allowed', 'Threads Disabled', { method: 'getThreadMessages' });
		}

		const thread = Messages.findOneById(tmid);
		if (!thread) {
			return;
		}

		const card = Cards.findOneById(cardId);
		const room = Rooms.findOneById(thread.rid);

		if (!canAccessRoom(room, card)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getThreadMessages' });
		}

		return readThread({ cardId, rid: thread.rid, tmid });
	},
});

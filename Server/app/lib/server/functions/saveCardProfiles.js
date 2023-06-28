import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Cards, CardProfiles } from '../../../models';
import { hasPermission } from '../../../authorization';
import _ from 'underscore';

export const saveCardProfiles = function(userId, cardId, profiles) {
	const card = Cards.findOneById(cardId);

	if (!card) {
		return true;
	}

	if (userId !== card.userId && !hasPermission(userId, 'edit-other-user-info')) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed');
	}

	CardProfiles.removeByCardId(cardId);

	let count = 0;

	_.each(profiles, function(profile) {
		delete profile._id;
		profile.cardId = cardId;
		profile.order = count++;

		if (!profile.name && !s.trim(profile.name)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field name is required');
		}

		if (!profile.type && !s.trim(profile.type)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field type is required');
		}

		CardProfiles.create(profile);
	});

	return true;
};

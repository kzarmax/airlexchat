import { Meteor } from 'meteor/meteor';
import { getFullCardData } from '/app/lib';

Meteor.publish('fullCardData', function(cardId, limit) {
	if (!this.userId) {
		return this.ready();
	}

	const result = getFullCardData({
		userId: this.userId,
		cardId,
		limit,
	});

	if (!result) {
		return this.ready();
	}

	return result;
});

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Users, Cards } from '/app/models';
import { hasPermission } from '/app/authorization';
import _ from 'underscore';

Meteor.methods({
	setCardOrders(cards) {
		check(cards, Array);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'setCardOrders',
			});
		}

		const user = Users.findOneById(Meteor.userId());
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to setCardOrders', {
				method: 'setCardOrders',
			});
		}

		_.each(cards, function(card) {
			if (user._id !== card.userId && !hasPermission(user._id, 'edit-other-user-info')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed');
			}

			Cards.setOrder(card._id || card.cardId, card.order);
		});

		return true;

	},
});

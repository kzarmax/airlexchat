// Convenience method, almost need to turn it into a middleware of sorts
import { Meteor } from 'meteor/meteor';
import { Cards } from '../../../models';
import { API } from '../api';

API.helperMethods.set('getCardFromParams', function _getCardFromParams() {
	const doesntExist = { _doesntExist: true };
	let card;
	const params = this.requestParams();

	if (params.cardId && params.cardId.trim()) {
		card = Cards.findOneById(params.cardId) || doesntExist;
	// } else if (params.username && params.username.trim()) {
	// 	card = Cards.findOneByUsername(params.username) || doesntExist;
	// } else if (params.name && params.name.trim()) {
	// 	card = Cards.findOneByName(params.name) || doesntExist;
	} else {
		throw new Meteor.Error('error-card-param-not-provided', 'The required "cardId" param was not provided');
	}

	if (card._doesntExist) {
		throw new Meteor.Error('error-invalid-card', 'The required "cardId" or "username" or "name" param provided does not match any cards');
	}

	return card;
});

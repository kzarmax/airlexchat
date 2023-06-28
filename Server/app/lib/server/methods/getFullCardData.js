import { Meteor } from 'meteor/meteor';
import { getFullCardData } from '../functions';
import { getFullCardDataWithCId } from '../functions';

Meteor.methods({
	getFullCardData({ cardId = '', limit = 1 }) {
		return getFullCardData({ userId: Meteor.userId(), cardId, limit });
	},
	getFullCardDataWithCId({ cId = '' }) {
		return getFullCardDataWithCId({ cId });
	}
});

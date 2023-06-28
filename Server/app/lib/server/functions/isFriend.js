// import { Meteor } from 'meteor/meteor';
// import s from 'underscore.string';
import { Friends } from '../../../models';
// import { hasPermission } from '../../../authorization';
// import _ from 'underscore';

export const isFriend = function(cardId, friendCardId) {
	const friends = Friends.findByCardIdFriendCardId(cardId, friendCardId).count();

	return friends > 0 ? true : false;
};

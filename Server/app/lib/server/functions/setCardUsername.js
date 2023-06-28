import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { Cards, Friends, Messages, Subscriptions, Rooms, LivechatDepartmentAgents } from '../../../models';
import { hasPermission } from '../../../authorization';
import { RateLimiter } from '../lib';
import { checkUsernameBlocked } from '.';

export const _setCardUsername = function(cardId, u) {
	const username = s.trim(u);
	if (!cardId || !username) {
		return false;
	}

	const card = Cards.findOneById(cardId);

	// Card already has desired username, return
	const _updatedAt = new Date();
	const isChangedCardName = card.username !== username;

	const previousUsername = card.username;
	if(isChangedCardName){
		if (checkUsernameBlocked(username)) {
			return false;
		}
		Cards.setUsername(card._id, username);
		card.username = username;
	}

	// Username is available; if coming from old username, update all references
	if (isChangedCardName) {
		// 友達に登録されているユーザー名を変更
		Friends.updateAllUsernamesByFriendCardId(card._id, username);

		Messages.updateAllUsernamesByCardId(card._id, username);
		Messages.updateUsernameOfEditByCardId(card._id, username);
		// TODO: mention
		// Messages.findByMention(previousUsername).forEach(function(msg) {
		// 	const updatedMsg = msg.msg.replace(new RegExp(`@${ previousUsername }`, 'ig'), `@${ username }`);
		// 	return Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername(msg._id, previousUsername, username, updatedMsg);
		// });
		// TODO: rooms.usernames 使ってる？
		Rooms.replaceUsername(previousUsername, username);
		Rooms.replaceUsernameOfCardByCardId(card._id, username);
		Subscriptions.setUserUsernameByCardId(card._id, username);
		Subscriptions.setNameAndOpponentUsernameForDirectRoomsWithOpponentId(card._id, username);
		LivechatDepartmentAgents.replaceUsernameOfAgentByUserId(card._id, username);
	}


	return card;
};

// export const setCardUsername = RateLimiter.limitFunction(_setCardUsername, 1, 60000, {
export const setCardUsername = RateLimiter.limitFunction(_setCardUsername, 1, 1000, {
	[0]() {
		return !Meteor.userId() || !hasPermission(Meteor.userId(), 'edit-other-user-info');
	},
});

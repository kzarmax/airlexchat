import { Meteor } from 'meteor/meteor';
// import s from 'underscore.string';
import { Cards, Friends } from '../../../models';
import { hasPermission } from '../../../authorization';
// import _ from 'underscore';

export const saveFriend = function(userId, friendData) {

	if (!friendData._id) {
		// insert friend
		const card = Cards.findOneById(friendData.cardId);

		if (!card) {
			return true;
		}

		if (userId !== card.userId && !hasPermission(userId, 'edit-other-user-info')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		const friendCard = Cards.findOneById(friendData.friendCardId);

		if (!friendCard) {
			return true;
		}

		const friend = Object.assign({}, friendData);

		let _id = null;
		// 自分のデータ
		const ownFriend = Friends.findOneByCardIdFriendCardId(card._id, friendCard._id);
		if (ownFriend) {
			_id = ownFriend._id;
		} else {
			delete friend._id;
			friend.userId = card.userId;
			friend.cardId = card._id;
			friend.friendCardId = friendCard._id;
			friend.username = friendCard.username;
			_id = Friends.create(friend);
		}

		// 相手のデータ
		const opponentFriend = Friends.findOneByCardIdFriendCardId(friendCard._id, card._id);
		if (!opponentFriend) {
			friend.userId = friendCard.userId;
			friend.cardId = friendCard._id;
			friend.friendCardId = card._id;
			friend.username = card.username;
			delete friend.memo;
			delete friend.talk;
			delete friend.call;
			delete friend.video;
			delete friend.block;
			Friends.create(friend);
		}

		return _id;
	}

	const update = {};

	if (friendData.memo) {
		update.memo = friendData.memo;
	}
	if (typeof friendData.talk === 'boolean') {
		update.talk = friendData.talk;
	}
	if (typeof friendData.call === 'boolean') {
		update.call = friendData.call;
	}
	if (typeof friendData.video === 'boolean') {
		update.video = friendData.video;
	}
	if (typeof friendData.block === 'boolean') {
		update.block = friendData.block;
	}

	Friends.updateById(friendData._id, update);

	return true;
};

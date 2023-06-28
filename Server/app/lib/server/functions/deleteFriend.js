import { Friends, Subscriptions, Rooms, Messages } from '../../../models';

export const deleteFriend = function(friendId) {
	const friend = Friends.findOneById(friendId, {
		fields: { _id: 1, userId: 1, cardId: 1, friendCardId: 1 },
	});

	if (friend) {
		const rid = [friend.cardId, friend.friendCardId].sort().join('');

		// Subscriptions
		Subscriptions.removeByRoomId(rid);
		// Messages
		Messages.removeFilesByRoomId(rid);
		Messages.removeByRoomId(rid);
		// Rooms
		Rooms.removeById(rid);
		// Friends
		// 自分
		Friends.removeById(friend._id);
		// 相手
		Friends.removeByCardIdFriendCardId(friend.friendCardId, friend.cardId);

	}
};

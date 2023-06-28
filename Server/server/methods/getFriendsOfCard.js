import { Meteor } from 'meteor/meteor';
import { Friends } from '/app/models';
// import { hasPermission } from '/app/authorization';

Meteor.methods({
	async getFriendsOfCard(cardId) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getFriendsOfCard' });
		}
		// TODO: 取れない
		return await Friends.model.rawCollection().aggregate([
			{ $match: { cardId } },
			{
				$lookup: {
					from: 'rocketchat_cards',
					localField: 'friendCardId',
					foreignField: '_id',
					as: 'card',
				},
			},
			{
				$project: {
					'card._id': 1,
					'card.username': 1,
				},
			},
		]).toArray();

		/*
		return {
			friends: await Friends.model.rawCollection().aggregate([
				{ $match: { cardId } },
				{
					$lookup:
						{
							from: 'rocketchat_cards',
							localField: 'friendId',
							foreignField: '_id',
							as: 'card',
						},
				},
				{
					$project: {
						'card._id': 1,
						'card.username': 1,
					},
				},
				// ...(showAll ? [] : [{ $match: { 'u.status': { $in: ['online', 'away', 'busy'] } } }]),
				// {
				// 	$project: {
				// 		_id: { $arrayElemAt: ['$u._id', 0] },
				// 		name: { $arrayElemAt: ['$u.name', 0] },
				// 		username: { $arrayElemAt: ['$u.username', 0] },
				// 	},
				// },
			]).toArray(),
		};
		*/
	},
});

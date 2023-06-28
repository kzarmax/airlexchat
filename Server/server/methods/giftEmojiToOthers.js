import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import {Cards, Messages, Rooms, Users} from '../../app/models';
import {Notifications} from "/app/notifications";
import {callbacks} from "/app/callbacks";
import * as CONSTANTS from "/app/videobridge/constants";

Meteor.methods({
	giftEmojiToOthers(id, emoji, chattings, description) {
		check(id, String);
		check(chattings, Array);

		const user = Meteor.user();

		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setUserPassword',
			});
		}

		// const userIds = receivers.map(item => item.userId);
		//
		// Users.update({ _id: { $in: userIds } }, {
		// 	$addToSet: {
		// 		emojis: id,
		// 	},
		// });
		//
		// users.forEach(item => {
		// 	Notifications.notifyUser(item.user_id, 'notification', {
		// 		type: 'gift-emoji',
		// 		payload:{
		// 			_id: Random.id(),
		// 			sender_id: user._id,
		// 			sender_name: item.sender_name,
		// 			emoji_id: id,
		// 			ts: new Date(),
		// 			msg:name
		// 		}
		// 	});
		// });

		console.log('Create Gift Message');

		chattings.forEach(chatting => {
			const card = Cards.findOneByIdAndUserId(chatting.cardId, Meteor.userId());
			const room = Rooms.findOneById(chatting.rid);

			const messge = JSON.stringify({
				emoji_id : emoji._id,
				description
			});
			const message = Messages.createWithTypeRoomIdMessageAndCard('gift_message', chatting.rid, messge, card, {
				actionLinks: [
					{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), method_id: 'joinJitsiCall', params: '' },
				],
			});
			message.mentions = [
				{
					_id: card.userId,
					username: card.username,
				},
			];
			callbacks.run('afterSaveMessage', message, { ...room });
		});


		return true;
	},
});

import { Meteor } from 'meteor/meteor';
import { Users, Cards, Subscriptions } from "/app/models";
import {Notifications} from "/app/notifications";

export const inviteWithCId = (fromCardId, toCId) => {
	if (!fromCardId || !toCId) {
		throw new Meteor.Error('error-invalid-params', 'Invalid Params', { method: 'inviteWithCId' });
	}

	const card = Cards.findOneByCId(toCId);
	if(!card)
		throw new Meteor.Error('error-invalid-cardId', 'Invalid CardID', { method: 'inviteWithCId' });

	const user = Users.findOne(card.userId);
	if(!user)
		throw new Meteor.Error('error-no-exist-user', 'Invalid User', { method: 'inviteWithCId' });

	const subscription = Subscriptions.findByUserIdAndOtherCardIdAndType(user._id, fromCardId, ['owner']);
	if (subscription) {
		throw new Meteor.Error('error-exist-room', 'Invalid Request', { method: 'inviteWithCId' });
	}

	Notifications.notifyUser(user._id, 'invitation', {
		title:'Invitation',
		text:'Invitation',
		duration:3000,
		payload: {
			userId: user._id,
			cardId: fromCardId,
			message: 'Invitation'
		},
	});

	return true;
};

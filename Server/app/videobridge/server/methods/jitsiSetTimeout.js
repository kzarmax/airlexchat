import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Rooms, Messages, Users, Cards } from '../../../models/server';
import { callbacks } from '../../../callbacks/server';
import { metrics } from '../../../metrics/server';
import * as CONSTANTS from '../../constants';
import { canSendMessage } from '../../../authorization/server';
import { SystemLogger } from '../../../logger/server';

Meteor.methods({
	'jitsi:updateTimeout': (rid, cardId, onlyAudio) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:updateTimeout' });
		}

		const uid = Meteor.userId();

		const user = Users.findOneById(uid, {
			fields: {
				username: 1,
				type: 1,
			},
		});

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'jitsi:updateTimeout',
			});
		}

		try {
			const room = canSendMessage(rid, { uid, cardId, username: user.username, type: user.type, message_type: onlyAudio?'jitsi_call_started':'jitsi_video_call_started' });

			const currentTime = new Date().getTime();

			const jitsiTimeout = room.jitsiTimeout && new Date(room.jitsiTimeout).getTime();

			const nextTimeOut = new Date(currentTime + CONSTANTS.TIMEOUT);

			if (!jitsiTimeout || currentTime > jitsiTimeout - CONSTANTS.TIMEOUT / 2) {
				Rooms.setJitsiTimeout(rid, nextTimeOut);
			}

			const {_id: messageId, t, msg, cardId : messageCardId } = room.lastMessage;

			let canUpdate = false;
			let attendCards = [];
			let message = {};

			try{
				if(t && ((onlyAudio && t==='jitsi_call_started') || (!onlyAudio && t==='jitsi_video_call_started'))){
					message = Messages.findOneById(messageId);
					attendCards = JSON.parse(message.msg);
					canUpdate = attendCards && !!attendCards.length;
				}
			} catch(e){
			}


			if (!canUpdate) {
				metrics.messagesSent.inc(); // TODO This line needs to be moved to it's proper place. See the comments on: https://github.com/RocketChat/Rocket.Chat/pull/5736

				const text = JSON.stringify([cardId]);
				message = Messages.createWithTypeRoomIdMessageAndCard(onlyAudio?'jitsi_call_started':'jitsi_video_call_started', rid, text, card, {
					actionLinks: [
						{ icon: 'icon-videocam', label: TAPi18n.__('Click_to_join'), method_id: 'joinJitsiCall', params: '' },
					],
				});
				message.msg = TAPi18n.__('Started_a_video_call');
				callbacks.run('afterSaveMessage', message, { ...room, jitsiTimeout: currentTime + CONSTANTS.TIMEOUT });
			} else {
				message = Messages.findOneById(messageId);
				message.msg = JSON.stringify([...attendCards, cardId]);
				Messages.update({ _id: messageId }, { $set: message });
			}

			return jitsiTimeout || nextTimeOut;
		} catch (error) {
			SystemLogger.error('Error starting video call:', error);

			throw new Meteor.Error('error-starting-video-call', TAPi18n.__(error.message, {}, 'ja'));
		}
	},
});

Meteor.methods({
	'jitsi:endTimeout': (rid, cardId, onlyAudio) => {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jitsi:endTimeout' });
		}

		const room = Rooms.findOneById(rid);

		const card = Cards.findOneByIdAndUserId(cardId, Meteor.userId());
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'jitsi:endTimeout',
			});
		}

		const currentTime = new Date().getTime();

		const {_id: messageId, t, cardId : messageCardId } = room.lastMessage;
		let message = Messages.findOneById(messageId);

		let canUpdate = false;
		let attendCards = [];
		try {
			attendCards = JSON.parse(message.msg);
			canUpdate = attendCards && !!attendCards.length && t && ((onlyAudio && t==='jitsi_call_started') || (!onlyAudio && t==='jitsi_video_call_started'));
		} catch(e){
		}

		if (canUpdate) {
			const newAttendCards = attendCards.filter(card_id => card_id !== cardId);
			message.msg = JSON.stringify(newAttendCards);

			Messages.update({ _id: messageId }, { $set: message });
		}
	},
});

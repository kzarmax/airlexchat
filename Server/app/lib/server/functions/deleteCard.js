import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { FileUpload } from '../../../file-upload';
import { hasRole, getUsersInRole } from '../../../authorization';
import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';
import { Users, Cards, CardProfiles, Friends, Subscriptions, Rooms, Messages } from '../../../models';

export const deleteCard = function(cardId) {
	const card = Cards.findOneById(cardId, {
		fields: { _id: 1, userId: 1, username: 1, avatarOrigin: 1 },
	});

	if (card) {
		const roomCache = [];

		// 登録している全てのルームのオーナーをチェック
		Subscriptions.db.findByCardId(card._id).forEach((subscription) => {
			const roomData = {
				rid: subscription.rid,
				t: subscription.t,
				subscribers: 0,
			};

			// DM以外はオーナー、メンバーを確認
			if (roomData.t !== 'd') {
				// 自分がルームのオーナーの場合
				const room = Rooms.findOneById(subscription.rid);
				if (room.c._id === subscription.c._id) {
					// メンバーの数を取得
					roomData.subscribers = Subscriptions.findByRoomId(subscription.rid).count();
				}
			}

			roomCache.push(roomData);
		});

		const messageErasureType = settings.get('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				Messages.findFilesByCardId(card._id).forEach(function({ file }) {
					store.deleteById(file._id);
				});
				Messages.removeByCardId(card._id);
				break;
			case 'Unlink':
				const rocketCat = Users.findOneById('airlex.chat');
				const nameAlias = TAPi18n.__('Removed_User');
				Messages.unlinkCardId(card._id, rocketCat._id, rocketCat.username, nameAlias);
				break;
		}

		roomCache.forEach((roomData) => {
			// // ルームのメンバー数を取得
			// if (roomData.subscribers === null && roomData.t !== 'd' && roomData.t !== 'c') {
			// 	roomData.subscribers = Subscriptions.findByRoomId(roomData.rid).count();
			// }

			// DMの場合、チャンネル以外でメンバーが1人の場合にルーム関連を削除する
			if (roomData.t === 'd' || (roomData.t !== 'c' && roomData.subscribers > 0)) {
				// 購読を削除
				Subscriptions.removeByRoomId(roomData.rid);
				// 添付ファイルを削除
				Messages.removeFilesByRoomId(roomData.rid);
				// メッセージを削除
				Messages.removeByRoomId(roomData.rid);
				// ルームを削除
				Rooms.removeById(roomData.rid);
			}
		});
		// カードの購読を削除
		Subscriptions.removeByCardId(card._id);
		// Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		// カードの友達を削除
		Friends.removeByCardId(card._id);
		// カードIDを友達に登録している友達情報を削除
		Friends.removeByFriendCardId(card._id);

		// Avatar
		if (card.avatarOrigin === 'upload' || card.avatarOrigin === 'url') {
			FileUpload.getStore('Avatars').deleteByCardId(card._id);
		}
		// Image
		if (card.imageOrigin === 'upload' || card.imageOrigin === 'url') {
			FileUpload.getStore('CardImages').deleteByCardId(card._id);
		}
		// CardProfiles
		CardProfiles.removeByCardId(card._id);
		// Card
		Cards.removeById(card._id);

		// Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
		Notifications.notifyLogged('Cards:Deleted', { cardId });
	}

};

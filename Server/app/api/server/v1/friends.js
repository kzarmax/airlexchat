import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Users, Cards, Friends } from '../../../models';
import { isFriend, saveFriend, setFriendPermissions } from '../../../lib';
import { API } from '../api';
// import _ from 'underscore';
// import s from 'underscore.string';
// import { hasPermission } from '/app/authorization';

/**
 * 友達かどうかを取得する
 *
 * @param String cardId カードID
 * @param String friendCardId 友達のカードID
 * @return Boolean isFriend 友達かどうか
 */
API.v1.addRoute('friends.is', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			friendCardId: String,
		});

		return API.v1.success({ isFriend: isFriend(this.bodyParams.cardId, this.bodyParams.friendCardId) });
	},
});

/**
 * 友達一覧を取得する
 *
 * カードの全選択状態を判断し、
 * 全ての友達一覧または選択しているカードの友達一覧を返す
 *
 * @return friends 友達一覧
 */
API.v1.addRoute('friends.list', { authRequired: true }, {
	get() {
		const { selectAll } = Users.findOneById(this.userId);
		let friends = [];

		if (selectAll) {
			friends = Friends.findByUserId(this.userId).fetch();
		} else {
			const { card } = Cards.findOneActiveByUserId(this.userId);
			if (card) {
				friends = Friends.findByCardId(card._id).fetch();
			}
		}
		if (!Array.isArray(friends)) {
			friends = [];
		}

		// let cards = Cards.findByCardIds(this.bodyParams.cardIds, { sort : {order: 1} }).fetch();

		return API.v1.success({ friends });
	},
});

/**
 * 友達情報を取得する
 * カードIDと友達IDまたは友達のカードIDを指定する
 *
 * @param String cardId カードID
 * @param String friendId 友達ID（オプション）
 * @param String friendCardId 友達のカードID（オプション）
 * @return friend 友達情報
 */
API.v1.addRoute('friends.info', { authRequired: true }, {
	get() {
		const { friendId, cardId, friendCardId } = this.queryParams;

		if (!cardId || !cardId.trim()) {
			return API.v1.failure('The \'cardId\' and \'friendId\' or \'friendCardId\' param is required');
		}
		if ((!friendId || !friendId.trim()) && (!friendCardId || !friendCardId.trim())) {
			return API.v1.failure('The \'cardId\' and \'friendId\' or \'friendCardId\' param is required');
		}

		let friend = {};
		if (friendId) {
			friend = Friends.findOneByIdCardId(friendId, cardId);
		} else {
			friend = Friends.findOneByCardIdFriendCardId(cardId, friendCardId);
		}
		if (friend && !friend.memo) {
			friend.memo = null;
		}

		return API.v1.success({ friend });
	},
});

/**
 * 友達情報を作成する
 *
 * @param String cardId カードID
 * @param String friendCardId 友達のカードID
 * @param String memo メモ（オプション）
 * @param Boolean talk トークフラグ（オプション）
 * @param Boolean call 通話フラグ（オプション）
 * @param Boolean video ビデオ通話フラグ（オプション）
 * @param Boolean block ブロックフラグ（オプション）
 * @return {
 *     friend 作成した友達情報
 *     friends 友達情報一覧
 * }
 */
API.v1.addRoute('friends.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			friendCardId: String,
			memo: Match.Maybe(String),
			talk: Match.Maybe(Boolean),
			call: Match.Maybe(Boolean),
			video: Match.Maybe(Boolean),
			block: Match.Maybe(Boolean),
		});

		// 友達情報を保存する
		const friendId = saveFriend(this.userId, this.bodyParams);

		return API.v1.success({ friend: Friends.findOneById(friendId), friends: Friends.findByUserId(this.userId).fetch() });
	},
});

/**
 * 友達情報を更新する
 *
 * @param String friendId 友達ID
 * @param String memo メモ（オプション）
 * @param Boolean talk トークフラグ（オプション）
 * @param Boolean call 通話フラグ（オプション）
 * @param Boolean video ビデオ通話フラグ（オプション）
 * @param Boolean block ブロックフラグ（オプション）
 * @return {
 *     friend 更新した友達情報
 *     friends 友達情報一覧
 * }
 */
API.v1.addRoute('friends.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			friendId: String,
			memo: Match.Maybe(String),
			talk: Match.Maybe(Boolean),
			call: Match.Maybe(Boolean),
			video: Match.Maybe(Boolean),
			block: Match.Maybe(Boolean),
		});

		const friendData = Object.assign({}, this.bodyParams);
		friendData._id = this.bodyParams.friendId;
		delete friendData.friendId;

		// カード情報を保存する
		Meteor.runAsUser(this.userId, () => saveFriend(this.userId, friendData));

		return API.v1.success({ friend: Friends.findOneById(friendData._id), friends: Friends.findByUserId(this.userId).fetch() });
	},
});

/**
 * 友達を削除する
 * 友達IDまたはカードID、友達のカードIDを指定する
 *
 * @param String friendId 友達ID（オプション）
 * @param String cardId カードID（オプション）
 * @param String friendCardId 友達のカードID（オプション）
 * @return friends 友達情報一覧
 */
API.v1.addRoute('friends.delete', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			friendId: Match.Maybe(String),
			friendCardId: Match.Maybe(String),
		});

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteFriend', this.bodyParams.friendId, this.bodyParams.cardId, this.bodyParams.friendCardId);
		});

		return API.v1.success({ friends: Friends.findByUserId(this.userId).fetch() });
	},
});

/**
 * 友達をブロックする
 *
 * @param String cardId カードID
 * @param String friendId 友達ID
 * @param Boolean block ブロックフラグ
 * @return success
 */
API.v1.addRoute('friends.block', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			cardId: String,
			friendId: String,
			// block: Match.Maybe(Boolean),
			block: Boolean,
		}));

		Meteor.runAsUser(this.userId, () => Meteor.call('blockCard', this.bodyParams.cardId, this.bodyParams.friendId, this.bodyParams.block));

		return API.v1.success();
	},
});

/**
 * 複数の友達のブロック設定を行う
 *
 * @param String cardId カードID
 * @param Array friends ブロック設定
 *                  [
 *                      {
 *                          String friendId 友達ID
 *                          Boolean block ブロックフラグ
 *                      }
 *                  ]
 * @return friends 友達情報一覧
 */
API.v1.addRoute('friends.blocks', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			friends: Match.Maybe(Array),
		});

		Meteor.runAsUser(this.userId, () => Meteor.call('blockCards', this.bodyParams.cardId, this.bodyParams.friends));

		return API.v1.success({ friends: Friends.findByUserId(this.userId).fetch() });
	},
});

/**
 * 複数の友達の機能制限設定を行う
 *
 * @param String cardId カードID
 * @param Array friends 設定
 *                  {
 *                      [
 *                          String friendId 友達ID
 *                          Boolean talk トークフラグ（オプション）
 *                          Boolean call 通話フラグ（オプション）
 *                          Boolean video ビデオ通話フラグ（オプション）
 *                          Boolean block ブロックフラグ（オプション）
 *                      ]
 *                  }
 * @return friends 友達情報一覧
 */
API.v1.addRoute('friends.setPermissions', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			friends: Match.Maybe(Array),
		});

		Meteor.runAsUser(this.userId, () => setFriendPermissions(this.userId, this.bodyParams.cardId, this.bodyParams.friends));

		return API.v1.success({ friends: Friends.findByUserId(this.userId).fetch() });
	},
});

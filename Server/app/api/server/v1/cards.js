import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { Users, Cards, CardProfiles, Friends } from '../../../models';
import { settings } from '../../../settings';
import { getURL } from '../../../utils';
import {
	saveCard,
	saveCardProfiles,
	setCardAvatar,
	setCardImage,
	cardPasswordHash
} from '../../../lib';
import { API } from '../api';
// import _ from 'underscore';
import Busboy from 'busboy';
import { hasPermission } from '../../../authorization';

/**
 * カード情報を取得する
 *
 * @param String cardId カードID
 * @return card カード情報
 */
API.v1.addRoute('cards.info', { authRequired: true }, {
	get() {
		const { _id } = this.getCardFromParams();

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getFullCardData', { cardId: _id, limit: 1 });
		});

		if (!result) {
			return API.v1.failure(`Failed to get the card data for the cardId of "${ _id }".`);
		}

		result.user = Users.findOneById(result.userId, { fields: { username: 1, name: 1, emails: 1 } });

		return API.v1.success({ card: result });
	},
});

/**
 * カードを1件選択する（1件のみ）
 *
 * @param String cardId カードID
 * @return {
 *     card 選択したカード情報
 *     cards カード情報一覧
 * }
 */
API.v1.addRoute('cards.selectOne', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
		});
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('setUserActiveCard', this.userId, this.bodyParams.cardId);
			Users.setSelectAll(this.userId, false);
		});
		return API.v1.success({ card: Cards.findOneById(this.bodyParams.cardId), cards: Cards.findByUserId(this.userId).fetch() });
	},
});


API.v1.addRoute('cards.resetPassword', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			password: String,
		});

		const password = cardPasswordHash(this.bodyParams.password);

		Cards.updateById(this.bodyParams.cardId, { isSecret: true, password: password});

		return API.v1.success();
	},
});

/**
 *
 */
API.v1.addRoute('cards.openSecret', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			password: String,
		});

		let card = Cards.findOneById(this.bodyParams.cardId);

		const hashPass = Number(cardPasswordHash(this.bodyParams.password));

		if(hashPass === Number(card.password))
			return API.v1.success();
		else
			return API.v1.failure('Password is invalid');
	},
});

/**
 * カードを複数選択する（選択しているすべて）
 *
 * @param Array cardIds カードID
 * @return cards カード情報一覧
 */
API.v1.addRoute('cards.selects', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			cardIds: Match.Maybe(Array),
		}));
		Meteor.runAsUser(this.userId, () => {
			Meteor.call('setUserActiveCards', this.userId, this.bodyParams.cardIds);
		});
		let cards = Cards.findByCardIds(this.bodyParams.cardIds, { sort : { order: 1 } }).fetch();
		if (!Array.isArray(cards)) {
			cards = [];
		}

		return API.v1.success({ cards });
	},
});

/**
 * カードの全選択状態を設定する
 *
 * @params selectAll カードの全選択状態
 * @return selectAll カードの全選択状態
 */
API.v1.addRoute('cards.selectAll', { authRequired: true }, {
	post() {
		const { selectAll } = this.bodyParams;

		if (!this.bodyParams.hasOwnProperty('selectAll')) {
			return API.v1.failure('The \'selectAll\' param is required');
		}

		Meteor.runAsUser(this.userId, () => {
			Users.setSelectAll(this.userId, selectAll);
		});

		return API.v1.success({ selectAll: this.bodyParams.selectAll });
	},
});

/**
 * カードの全選択状態をトグル設定する
 *
 * @return selectAll カードの全選択状態
 */
API.v1.addRoute('cards.toggleSelectAll', { authRequired: true }, {
	post() {
		const { selectAll } = Users.findOneById(this.userId);
		Meteor.runAsUser(this.userId, () => {
			Users.setSelectAll(this.userId, !selectAll);
		});

		return API.v1.success({ selectAll: !selectAll });
	},
});

/**
 * カードの友達一覧を取得する
 * @param String cardId カードID
 * @return friends 友達一覧
 */
API.v1.addRoute('cards.friends', { authRequired: true }, {
	get() {
		const { _id } = this.getCardFromParams();

		let friends;
		Meteor.runAsUser(this.userId, () => {
			// friends = Meteor.call('getFriendsOfCard', cardId);
			friends = Friends.findByCardId(_id).fetch();
		});

		if (!Array.isArray(friends)) {
			friends = [];
		}

		// const members = friends.fetch().map((s) => friends._id);

		// TODO: room 一覧?

		return API.v1.success({ friends });
	},
});

/**
 * カードの友達一覧を取得する
 * @return friends 友達一覧
 */
API.v1.addRoute('cards.friendAll', { authRequired: true }, {
	get() {

		let friends = [];
		Meteor.runAsUser(this.userId, () => {
			friends = Friends.findByUserId(this.userId).fetch();
		});

		if (!Array.isArray(friends)) {
			friends = [];
		}
		const friendCardIds = friends.map(f => f.friendCardId);
		const cards = Cards.findByCardIds(friendCardIds, { fields: { name: 1, username: 1, userId: 1, avatarETag: 1 }}).fetch();

		return API.v1.success({ cards });
	},
});

/**
 * カードを作成する
 *
 * @param String userId ユーザーID（オプション ユーザーIDが指定されている場合は指定されたユーザーIDのカードを作成）
 * @param String name カード名
 * @param String username ユーザー名
 * @param String comment コメント（オプション）
 * @param Object scene シーン（オプション）
 *               {
 *                   String code: // シーンコード
 *                   String name: // シーン名（自由入力）
 *               }
 * @param Boolean isSecret シークレットフラグ（オプション）
 * @param Array blocks ブロックカードID（オプション）
 * @param Array profiles プロフィール情報（オプション）
 *              [
 *                  {
 *                       name: String, // プロフィール名
 * 	                     type: String, // 種別
 * 	                     value: mixed, // 値
 * 	                     public: Boolean, // 公開状態（オプション）
 * 	                     order: Number, // 表示順（オプション）
 * 	                     freeItem: Boolean, // 自由項目（オプション）
 *                  },
 *              ]
 * @param Number order 表示順（オプション）
 * @param Boolean active 選択フラグ（オプション）
 * @return {
 *     card 作成したカード情報
 *     cards カード情報一覧
 * }
 */
API.v1.addRoute('cards.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: Match.Maybe(String),
			name: String,
			username: String,
			password: Match.Maybe(String),
			comment: Match.Maybe(String),
			scene: Match.Maybe(Object),
			isSecret: Match.Maybe(Boolean),
			blocks: Match.Maybe(Array),
			profiles: Match.Maybe(Array),
			order: Match.Maybe(Number),
			active: Match.Maybe(Boolean),
		});

		// ユーザーIDが指定されている場合は指定されたユーザーIDのカードを作成
		const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
		if(this.bodyParams.password){
			this.bodyParams.isSecret = true;
			this.bodyParams.password = cardPasswordHash(this.bodyParams.password);
		}

		// カード情報を保存する
		const cardId = saveCard(userId, this.bodyParams);

		// カード作成フラグ
		Users.setCardCreated(userId, true);

		if (Cards.findByUserId(this.userId).count() === 1) {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveCard', this.userId, cardId);
			});
		}

		// return API.v1.success({ card: Cards.findOneById(cardId) });
		return API.v1.success({ card: Cards.findOneById(cardId), cards: Cards.findByUserId(this.userId).fetch() });
	},
});

/**
 * カードを更新する
 * プロフィール情報については、設定されている値をすべて削除し、指定した配列で置き換える
 *
 * @param String cardId カードID
 * @param String name カード名（オプション）
 * @param String username ユーザー名（オプション）
 * @param String comment コメント（オプション）
 * @param Object scene シーン（オプション）
 *               {
 *                   String code: // シーンコード
 *                   String name: // シーン名（自由入力）
 *               }
 * @param Boolean isSecret シークレットフラグ（オプション）
 * @param Array blocks ブロックカードID（オプション）
 * @param Array profiles プロフィール情報（オプション）
 *              [
 *                  {
 *                       name: String, // プロフィール名
 * 	                     type: String, // 種別
 * 	                     value: mixed, // 値（オプション）
 * 	                     public: Boolean, // 公開状態（オプション）
 * 	                     order: Number, // 表示順（オプション）
 * 	                     freeItem: Boolean, // 自由項目（オプション）
 *                  },
 *              ]
 * @param Number order 表示順（オプション）
 * @param Boolean active 選択フラグ（オプション）
 * @return {
 *     card 更新したカード情報
 *     cards カード情報一覧
 * }
 */
API.v1.addRoute('cards.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			name: Match.Maybe(String),
			username: Match.Maybe(String),
			comment: Match.Maybe(String),
			scene: Match.Maybe(Object),
			blocks: Match.Maybe(Array),
			profiles: Match.Maybe(Array),
			isSecret: Match.Maybe(Boolean),
			password: Match.Maybe(String),
			order: Match.Maybe(Number),
			active: Match.Maybe(Boolean),
			back_color: Match.Maybe(String),
			text_color: Match.Maybe(String),
			disabledOption: Match.Maybe(Object)
		});

		if(this.bodyParams.password){
			this.bodyParams.password = cardPasswordHash(this.bodyParams.password);
		}

		const cardData = Object.assign({}, this.bodyParams);
		cardData._id = this.bodyParams.cardId;
		delete cardData.cardId;

		// カード情報を保存する
		Meteor.runAsUser(this.userId, () => saveCard(this.userId, cardData));

		return API.v1.success({ card: Cards.findOneById(this.bodyParams.cardId), cards: Cards.findByUserId(this.userId).fetch() });
	},
});

/**
 * カードを削除する
 *
 * @param String cardId カードID
 * @return cards カード情報一覧
 */
API.v1.addRoute('cards.delete', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
		});

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteCard', this.bodyParams.cardId);
		});

		return API.v1.success({ cards: Cards.findByUserId(this.userId).fetch() });
	},
});

/**
 * カードプロフィール情報を置き換える
 * 設定されている値をすべて削除し、指定した配列で置き換える
 *
 * @param String cardId カードID
 * @param Array profiles プロフィール情報（オプション）
 *              [
 *                  {
 *                       name: String, // プロフィール名
 * 	                     type: String, // 種別
 * 	                     value: mixed, // 値（オプション）
 * 	                     public: Boolean, // 公開状態（オプション）
 * 	                     order: Number, // 表示順（オプション）
 * 	                     freeItem: Boolean, // 自由項目（オプション）
 * 	                     active: Boolean, // 選択フラグ（オプション）
 *                  },
 *              ]
 * @return profiles カードプロフィール情報一覧
 */
API.v1.addRoute('cards.profiles.replace', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cardId: String,
			profiles: Match.Maybe(Array),
		});

		// カードプロフィール情報を保存する
		Meteor.runAsUser(this.userId, () => saveCardProfiles(this.userId, this.bodyParams.cardId, this.bodyParams.profiles));

		return API.v1.success({ profiles: CardProfiles.findByCardId(this.bodyParams.cardId).fetch() });
	},
});

/**
 * カードのアバター画像を設定する
 *
 * @param String avatarUrl アバター画像URL（オプション）
 * @param String userId ユーザーID（オプション）
 * @param String cardId カードID
 * @return success
 */
API.v1.addRoute('cards.setAvatar', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			avatarUrl: Match.Maybe(String),
			userId: Match.Maybe(String),
			cardId: String,
			// username: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'cards.setAvatar',
			});
		}

		const user = Meteor.users.findOne(this.userId);
		const card = this.getCardFromParams();
		if (!user) {
			return API.v1.unauthorized();
		} else if (user._id === card.userId && !hasPermission(user._id, 'edit-other-user-info')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'cards.setAvatar',
			});
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.avatarUrl) {
				setCardAvatar(card, this.bodyParams.avatarUrl, '', 'url');
			} else {
				const busboy = new Busboy({ headers: this.request.headers });
				const fields = {};
				// const getUserFromFormData = (fields) => {
				// 	if (fields.userId) {
				// 		return Users.findOneById(fields.userId, { _id: 1 });
				// 	}
				// 	// if (fields.username) {
				// 	// 	return Users.findOneByUsername(fields.username, { _id: 1 });
				// 	// }
				// };
				// const getCardFromFormData = (fields) => {
				// 	if (fields.cardId) {
				// 		return Cards.findOneById(fields.cardId, { _id: 1 });
				// 	}
				// 	// if (fields.username) {
				// 	// 	return Users.findOneByUsername(fields.username, { _id: 1 });
				// 	// }
				// };

				Meteor.wrapAsync((callback) => {
					busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
						if (fieldname !== 'image') {
							return callback(new Meteor.Error('invalid-field'));
						}
						const imageData = [];
						file.on('data', Meteor.bindEnvironment((data) => {
							imageData.push(data);
						}));

						file.on('end', Meteor.bindEnvironment(() => {
							setCardAvatar(card, Buffer.concat(imageData), mimetype, 'rest');
							callback();
						}));
					}));
					busboy.on('field', (fieldname, val) => {
						fields[fieldname] = val;
					});
					this.request.pipe(busboy);
				})();
			}
		});

		return API.v1.success();
	},
});

/**
 * カードのアバター画像を取得する
 *
 * @param String cardId カードID
 * @return アバター画像URL
 */
API.v1.addRoute('cards.getAvatar', { authRequired: false }, {
	get() {
		// const user = this.getUserFromParams();
		const card = this.getCardFromParams();

		// const url = getURL(`/avatar/${ user.username }`, { cdn: false, full: true });
		const url = getURL(`/avatar/${ card._id }`, { cdn: false, full: true });
		this.response.setHeader('Location', url);

		return {
			statusCode: 307,
			body: url,
		};
	},
});

/**
 * カードのアバター画像をリセットする
 *
 * @param String userId ユーザーID（オプション）
 * @param String cardId カードID
 * @return success
 */
API.v1.addRoute('cards.resetAvatar', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: Match.Maybe(String),
			cardId: String,
		});
		const card = this.getCardFromParams();

		if (card.userId === this.userId) {
			Meteor.runAsUser(this.userId, () => Meteor.call('resetCardAvatar', card._id));
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			Meteor.runAsUser(card.userId, () => Meteor.call('resetCardAvatar', card._id));
		} else {
			return API.v1.unauthorized();
		}

		return API.v1.success();
	},
});

/**
 * カード画像を設定する
 *
 * @param String imageUrl カード画像URL（オプション）
 * @param String userId ユーザーID（オプション）
 * @param String cardId カードID
 * @return success
 */
API.v1.addRoute('cards.setImage', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			imageUrl: Match.Maybe(String),
			userId: Match.Maybe(String),
			cardId: String,
			// username: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'cards.setImage',
			});
		}

		const user = Meteor.users.findOne(this.userId);
		const card = this.getCardFromParams();
		if (!user) {
			return API.v1.unauthorized();
		} else if (user._id === card.userId && !hasPermission(user._id, 'edit-other-user-info')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'cards.setImage',
			});
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.imageUrl) {
				setCardImage(card, this.bodyParams.imageUrl, '', 'url');
			} else {
				const busboy = new Busboy({ headers: this.request.headers });
				const fields = {};

				Meteor.wrapAsync((callback) => {
					busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
						if (fieldname !== 'image') {
							return callback(new Meteor.Error('invalid-field'));
						}
						const imageData = [];
						file.on('data', Meteor.bindEnvironment((data) => {
							imageData.push(data);
						}));

						file.on('end', Meteor.bindEnvironment(() => {
							setCardImage(card, Buffer.concat(imageData), mimetype, 'rest');
							callback();
						}));
					}));
					busboy.on('field', (fieldname, val) => {
						fields[fieldname] = val;
					});
					this.request.pipe(busboy);
				})();
			}
		});

		return API.v1.success();
	},
});

/**
 * カード画像を取得する
 *
 * @param String cardId カードID
 * @return カード画像URL
 */
API.v1.addRoute('cards.getImage', { authRequired: false }, {
	get() {
		const card = this.getRequestParams();

		const url = getURL(`/card/${ card._id }`, { cdn: false, full: true });
		this.response.setHeader('Location', url);

		return {
			statusCode: 307,
			body: url,
		};
	},
});

/**
 * カード画像をリセットする
 *
 * @param String userId ユーザーID（オプション）
 * @param String cardId カードID
 * @return success
 */
API.v1.addRoute('cards.resetImage', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: Match.Maybe(String),
			cardId: String,
		});
		const card = this.getCardFromParams();

		if (card.userId === this.userId) {
			Meteor.runAsUser(this.userId, () => Meteor.call('resetCardImage', card._id));
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			Meteor.runAsUser(card.userId, () => Meteor.call('resetCardImage', card._id));
		} else {
			return API.v1.unauthorized();
		}

		return API.v1.success();
	},
});

/**
 * カードの表示順を設定する
 *
 * @param Array cards カード情報
 * @return cards カード情報一覧
 */
API.v1.addRoute('cards.setOrders', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			cards: Array,
		});

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('setCardOrders', this.bodyParams.cards);
		});

		return API.v1.success({ cards: Cards.findByUserId(this.userId).fetch() });
	},
});


/**
 * カード情報を取得する
 *
 * @param String cardId カードID
 * @return card カード情報
 */
API.v1.addRoute('cards.detail', { authRequired: true }, {
	get() {
		const { cId } = this.requestParams();

		let result;
		Meteor.runAsUser(this.userId, () => {
			result = Meteor.call('getFullCardDataWithCId', { cId: cId });
		});

		if (!result) {
			return API.v1.failure(`Failed to get the card data for the CardID of "${ cId }".`);
		}

		return API.v1.success({ card: result });
	},
});


API.v1.addRoute('cards.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const cards = Cards.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			cards,
			count: cards.length,
			offset,
			total: Cards.find(query).count(),
		});
	},
});

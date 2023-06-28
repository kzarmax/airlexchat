// import { Meteor } from 'meteor/meteor';
import { Base } from './_Base';
import _ from 'underscore';
// import s from 'underscore.string';

// カードプロフィール情報
// {
// 	userId: String, // カードID
// 	cardId: String, // カードID
// 	name: String, // プロフィール名
// 	type: String, // 種別
// 	value: mixed, // 値
// 	public: Boolean, // 公開状態
// 	order: Number, // 表示順
// 	freeItem: Boolean, // 自由項目
// }
export class CardProfiles extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ cardId: 1 });
		this.tryEnsureIndex({ public: 1 });
		this.tryEnsureIndex({ order: 1 });
	}

	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	// FIND
	findByCardId(cardId, options) {
		if (options == null) { options = { sort : { order: 1 } }; }
		const query = { cardId };

		return this.find(query, options);
	}

	findPublicItemByCardId(cardId, options) {
		if (options == null) { options = { sort : { order: 1 } }; }
		const query = {
			cardId,
			public: true,
		};

		return this.find(query, options);
	}

	// UPDATE
	updateById(_id, data) {
		const query = { _id };

		const update = { $set: data };

		return this.update(query, update);
	}

	setPublic(_id, _public) {
		if (_public == null) { _public = true; }
		const update = {
			$set: {
				public: _public,
			},
		};

		return this.update(_id, update);
	}

	setOrder(_id, order) {
		if (order == null) { order = -1; }
		const update = {
			$set: {
				order,
			},
		};

		return this.update(_id, update);
	}

	// INSERT
	create(data) {
		const user = {
			createdAt: new Date,
			order: -1,
			public: true,
			freeItem: false,
		};

		_.extend(user, data);

		return this.insert(user);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	removeByCardId(cardId) {
		const query = { cardId };
		return this.remove(query);
	}

	removeByUserId(userId) {
		const query = { userId };
		return this.remove(query);
	}

}

export default new CardProfiles('card_profiles');

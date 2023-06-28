// import { Meteor } from 'meteor/meteor';
import { Base } from './_Base';
import _ from 'underscore';
// import s from 'underscore.string';

// シーン情報
// {
// 	code: String, // シーンコード
// 	name: String, // シーン名（日本語）
// 	values: Array // デフォルトプロフィール項目
// 	    [
// 	        {
// 	            name: String, // 項目名
// 	            type: String, // データ型名
// 	        },
// 	    ]
// 	public: Boolean, // 公開状態
// 	order: Number, // 表示順
// }
export class Scenes extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ code: 1 });
		this.tryEnsureIndex({ order: 1 });
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findByPublicItem(options) {
		if (options == null) { options = { sort : { order: 1 } }; }
		const query = { public: true };

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
		};

		_.extend(user, data);

		return this.insert(user);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

}

export default new Scenes('scenes');

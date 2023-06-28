// import { Meteor } from 'meteor/meteor';
// import { Accounts } from 'meteor/accounts-base';
import { Base } from './_Base';
import Subscriptions from './Subscriptions';
import { Random } from 'meteor/random';
import _ from 'underscore';
import s from 'underscore.string';

// カード
// {
// 	userId: String, // ユーザーID
//  cId: String, // カードID
// 	name: String, // カード名
// 	username: String, // ユーザー名
// 	comment: String, // コメント
// 	scene: // シーン
//      {
//          String code: // シーンコード
//          String name: // シーン名（自由入力）
//      }
// 	secret: Boolean, // シークレットフラグ
// 	blocks: Array [ ..String ], // ブロックカードID
// 	order: Number, // 表示順
// 	active: Boolean, // 選択フラグ
// 	avatarOrigin: String, // アバター
// 	imageOrigin: String, // アイコン
//	isSecret: String,
//	password: String,
// }
export class Cards extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ cId: 1 });
		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ username: 1 });
		this.tryEnsureIndex({ order: 1 });
		// this.tryEnsureIndex({ active: 1 }, { sparse: 1 });
	}

	findOneByName(name, options) {
		if (typeof name === 'string') {
			name = new RegExp(`^${ name }$`, 'i');
		}

		const query = { name };

		return this.findOne(query, options);
	}

	findOneByUsername(username, options) {
		if (typeof username === 'string') {
			username = new RegExp(`^${ username }$`, 'i');
		}

		const query = { username };

		return this.findOne(query, options);
	}

	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findOneByCId(cId, options){
		const query = {
			cId,
			isSecret: {
				$ne: true
			}
		};

		return this.findOne(query, options);
	}

	findOneByCardId(cardId, options) {
		const query = { _id: cardId };

		return this.findOne(query, options);
	}

	findOneByIdAndUserId(_id, userId, options) {
		const query = { _id, userId };

		return this.findOne(query, options);
	}

	findOneByIdAndCardId(_id, cardId, options) {
		const query = { _id, cardId };

		return this.findOne(query, options);
	}

	findOneActiveByUserId(userId, options) {
		const query = {
			userId,
			active: true,
		};

		return this.findOne(query, options);
	}

	// FIND
	findById(_id) {
		const query = { _id };

		return this.find(query);
	}

	findByCardId(cardId) {
		const query = { _id: cardId };

		return this.find(query);
	}

	findByUserId(userId, options) {
		const query = { userId };
		if (options == null) { options = { sort : { order: 1 } }; }

		return this.find(query, options);
	}

	findByIds(ids, options) {
		const query = { _id: { $in: ids } };
		return this.find(query, options);
	}

	findByCardIds(cardIds, options) {
		const query = { _id: { $in: cardIds } };
		return this.find(query, options);
	}

	// TODO:
	findUsersNotOffline(options) {
		const query = {
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	findByRoomId(rid, options) {
		const data = Subscriptions.findByRoomId(rid).fetch().map((item) => item.u._id);
		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findByUsername(username, options) {
		const query = { username };

		return this.find(query, options);
	}

	// TODO:
	findActiveByUsernameOrNameRegexWithExceptions(searchTerm, exceptions, options) {
		if (exceptions == null) { exceptions = []; }
		if (options == null) { options = {}; }
		if (!_.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');
		const query = {
			$or: [{
				username: termRegex,
			}, {
				name: termRegex,
			}],
			active: true,
			type: {
				$in: ['user', 'bot'],
			},
			$and: [{
				username: {
					$exists: true,
				},
			}, {
				username: {
					$nin: exceptions,
				},
			}],
		};

		return this.find(query, options);
	}

	// TODO:
	findByActiveUsersExcept(searchTerm, exceptions, options, forcedSearchFields) {
		if (exceptions == null) { exceptions = []; }
		if (options == null) { options = {}; }
		if (!_.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const termRegex = new RegExp(s.escapeRegExp(searchTerm), 'i');

		const searchFields = forcedSearchFields || this.settings.get('Accounts_SearchFields').trim().split(',');

		const orStmt = _.reduce(searchFields, function(acc, el) {
			acc.push({ [el.trim()]: termRegex });
			return acc;
		}, []);
		const query = {
			$and: [
				{
					active: true,
					$or: orStmt,
				},
				{
					username: { $exists: true, $nin: exceptions },
				},
			],
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findUsersByNameOrUsername(nameOrUsername, options) {
		const query = {
			username: {
				$exists: 1,
			},

			$or: [
				{ name: nameOrUsername },
				{ username: nameOrUsername },
			],

			// type: {
			// 	$in: ['user'],
			// },
		};

		return this.find(query, options);
	}

	// TODO:
	findByUsernameNameOrEmailAddress(usernameNameOrEmailAddress, options) {
		const query = {
			$or: [
				{ name: usernameNameOrEmailAddress },
				{ username: usernameNameOrEmailAddress },
				{ 'emails.address': usernameNameOrEmailAddress },
			],
			type: {
				$in: ['user', 'bot'],
			},
		};

		return this.find(query, options);
	}

	findUsersByUsernames(usernames, options) {
		const query = {
			username: {
				$in: usernames,
			},
		};

		return this.find(query, options);
	}

	findUsersByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
		};
		return this.find(query, options);
	}

	findUsersByUserIds(userIds, options) {
		const query = {
			userId: {
				$in: userIds,
			},
		};
		return this.find(query, options);
	}

	findUsersWithUsernameByIds(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	findUsersWithUsernameByUserIds(userIds, options) {
		const query = {
			userId: {
				$in: userIds,
			},
			username: {
				$exists: 1,
			},
		};

		return this.find(query, options);
	}

	// TODO:
	findUsersWithUsernameByIdsNotOffline(ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	// TODO:
	findUsersWithUsernameByUserIdsNotOffline(userIds, options) {
		const query = {
			userId: {
				$in: userIds,
			},
			username: {
				$exists: 1,
			},
			status: {
				$in: ['online', 'away', 'busy'],
			},
		};

		return this.find(query, options);
	}

	// UPDATE
	setUsername(_id, username) {
		const update =
		{ $set: { username } };

		return this.update(_id, update);
	}

	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update(_id, update);
	}

	setAvatarOrigin(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag
			},
		};

		return this.update(_id, update);
	}

	unsetAvatarOrigin(_id) {
		const update = {
			$unset: {
				avatarOrigin: 1,
			},
		};

		return this.update(_id, update);
	}

	setImageOrigin(_id, origin, etag) {
		const update = {
			$set: {
				imageOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.update(_id, update);
	}

	unsetImageOrigin(_id) {
		const update = {
			$unset: {
				imageOrigin: 1,
			},
		};

		return this.update(_id, update);
	}

	setActive(_id, active) {
		if (active == null) { active = true; }
		const update = {
			$set: {
				active,
			},
		};

		return this.update(_id, update);
	}

	setActiveByIds(ids, active) {
		if (active == null) { active = true; }
		const query = {
			_id: {
				$in: ids,
			},
		};
		const update = {
			$set: {
				active,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setUserActive(userId, active) {
		if (active == null) { active = true; }
		const query = { userId };
		const update = {
			$set: {
				active,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setSecret(_id, secret) {
		if (secret == null) { secret = false; }
		const update = {
			$set: {
				secret,
			},
		};

		return this.update(_id, update);
	}

	setOrder(_id, order) {
		order = isNaN(parseInt(order)) ? 0 : parseInt(order);
		const update = {
			$set: {
				order,
			},
		};

		return this.update(_id, update);
	}

	updateById(_id, data) {
		const update = { $set: data };

		return this.update(_id, update);
	}

	addBlockByBlockId(_id, blockId) {
		const update = {
			$addToSet: {
				blocks: blockId,
			},
		};

		return this.update(_id, update);
	}

	removeBlockByBlockId(_id, blockId) {
		const query = { _id };
		const update = {
			$pull: { blocks: blockId },
		};
		return this.update(query, update);
	}

	// INSERT
	create(data) {
		const card = {
			cId: Random.id(8),
			createdAt: new Date,
			avatarOrigin: 'none',
			imageOrigin: 'none',
			blocks: [],
			order: -1,
			password: 0,
			isSecret: false,
			active: false,
		};

		_.extend(card, data);

		return this.insert(card);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	removeByCardId(cardId) {
		const query = { _id: cardId };
		return this.remove(query);
	}

	removeByUserId(userId) {
		const query = { userId };
		return this.remove(query);
	}
}

export default new Cards('cards');

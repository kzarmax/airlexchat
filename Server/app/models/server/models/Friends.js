// import { Meteor } from 'meteor/meteor';
import { Base } from './_Base';
import Subscriptions from './Subscriptions';
import _ from 'underscore';
// import s from 'underscore.string';

// 友達
// {
// 	userId: String, // ユーザーID
// 	cardId: String, // カードID
// 	friendCardId: String, // 友達カードID
// 	username: String, // ユーザー名
//	memo: String, // メモ
//	talk: Boolean, // トークフラグ
//	call: Boolean, // 通話フラグ
//	video: Boolean, // ビデオ通話フラグ
//	block: Boolean, // ブロックフラグ
// }
export class Friends extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ cardId: 1 });
		this.tryEnsureIndex({ friendCardId: 1 });
	}

	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findOneByIdCardId(_id, cardId, options) {
		const query = { _id, cardId };

		return this.findOne(query, options);
	}

	findOneByCardIdFriendCardId(cardId, friendCardId, options) {
		const query = { cardId, friendCardId };

		return this.findOne(query, options);
	}

	// FIND
	findById(_id, options) {
		const query = { _id };

		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = { userId };
		if (options == null) { options = { sort : { username: 1 } }; }

		return this.find(query, options);
	}

	findByCardId(cardId, options) {
		const query = { cardId };
		if (options == null) { options = { sort : { username: 1 } }; }

		return this.find(query, options);
	}

	findByFriendCardId(friendCardId, options) {
		const query = { friendCardId };

		return this.find(query, options);
	}

	findByIds(ids, options) {
		const query = { _id: { $in: ids } };
		if (options == null) { options = { sort : { username: 1 } }; }

		return this.find(query, options);
	}

	findByCardIds(cardIds, options) {
		const query = { cardId: { $in: cardIds } };
		if (options == null) { options = { sort : { username: 1 } }; }

		return this.find(query, options);
	}

	findByCardIdFriendCardId(cardId, friendCardId, options) {
		const query = { cardId, friendCardId };

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

	// TODO:
	findByRoomId(rid, options) {
		const data = Subscriptions.findByRoomId(rid).fetch().map((item) => item.u._id);
		const query = {
			_id: {
				$in: data,
			},
		};
		if (options == null) { options = { sort : { username: 1 } }; }

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
	setMemo(_id, memo) {
		const update =
		{ $set: { memo } };

		return this.update(_id, update);
	}

	setTalk(_id, talk) {
		if (talk == null) { talk = true; }
		const update = {
			$set: {
				talk,
			},
		};

		return this.update(_id, update);
	}

	setCall(_id, call) {
		if (call == null) { call = true; }
		const update = {
			$set: {
				call,
			},
		};

		return this.update(_id, update);
	}

	setVideo(_id, video) {
		if (video == null) { video = true; }
		const update = {
			$set: {
				video,
			},
		};

		return this.update(_id, update);
	}

	setBlock(_id, block) {
		if (block == null) { block = false; }
		const update = {
			$set: {
				block,
			},
		};

		return this.update(_id, update);
	}

	updateById(_id, data) {
		const update = { $set: data };

		return this.update(_id, update);
	}

	updateAllUsernamesByFriendCardId(friendCardId, username) {
		const query =	{ friendCardId };

		const update = {
			$set: {
				username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	// INSERT
	create(data) {
		const memo = {
			createdAt: new Date,
			talk: true,
			call: true,
			video: true,
			block: false,
			memo: null,
		};

		_.extend(memo, data);

		return this.insert(memo);
	}

	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}

	removeByUserId(userId) {
		const query = { userId };
		return this.remove(query);
	}

	removeByCardId(cardId) {
		const query = { cardId };
		return this.remove(query);
	}

	removeByCardIdFriendCardId(cardId, friendCardId) {
		const query = { cardId, friendCardId };
		return this.remove(query);
	}

	removeByFriendCardId(friendCardId) {
		const query = { friendCardId };
		return this.remove(query);
	}
}

export default new Friends('friends');

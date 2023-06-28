import _ from 'underscore';
import s from 'underscore.string';

import { Base } from './_Base';
import Messages from './Messages';
import Subscriptions from './Subscriptions';
import { getValidRoomName } from '../../../utils';
import { escapeRegExp } from '../../../../lib/escapeRegExp';

export class Rooms extends Base {
	constructor(...args) {
		super(...args);

		//this.tryEnsureIndex({ name: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ default: 1 }, { sparse: true });
		this.tryEnsureIndex({ featured: 1 }, { sparse: true });
		this.tryEnsureIndex({ muted: 1 }, { sparse: true });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ 'c._id': 1 });
		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ open: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ departmentId: 1 }, { sparse: 1 });
		// Tokenpass
		this.tryEnsureIndex({ 'tokenpass.tokens.token': 1 }, { sparse: true });
		this.tryEnsureIndex({ tokenpass: 1 }, { sparse: true });
		// discussions
		this.tryEnsureIndex({ prid: 1 }, { sparse: true });
		this.tryEnsureIndex({ fname: 1 }, { sparse: true });
		// field used for DMs only
		this.tryEnsureIndex({ uids: 1 }, { sparse: true });
		this.tryEnsureIndex({ cardIds: 1 }, { sparse: true });
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [{
				_id: _idOrName,
			}, {
				name: _idOrName,
			}],
		};

		return this.findOne(query, options);
	}

	updateSurveyFeedbackById(_id, surveyFeedback) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				surveyFeedback,
			},
		};

		return this.update(query, update);
	}

	updateLivechatDataByToken(token, key, value, overwrite = true) {
		const query = {
			'v.token': token,
			open: true,
		};

		if (!overwrite) {
			const room = this.findOne(query, { fields: { livechatData: 1 } });
			if (room.livechatData && typeof room.livechatData[key] !== 'undefined') {
				return true;
			}
		}

		const update = {
			$set: {
				[`livechatData.${ key }`]: value,
			},
		};

		return this.update(query, update);
	}

	findLivechat(filter = {}, offset = 0, limit = 20) {
		const query = _.extend(filter, {
			t: 'l',
		});

		return this.find(query, { sort: { ts: - 1 }, offset, limit });
	}

	findLivechatById(_id, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			_id,
		};

		return this.find(query, options);
	}

	findLivechatByIdAndVisitorToken(_id, visitorToken, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			_id,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	findLivechatByVisitorToken(visitorToken, fields) {
		const options = {};

		if (fields) {
			options.fields = fields;
		}

		const query = {
			t: 'l',
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	updateLivechatRoomCount = function() {
		const settingsRaw = Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'Livechat_Room_Count',
		};

		const update = {
			$inc: {
				value: 1,
			},
		};

		const livechatCount = findAndModify(query, null, update);

		return livechatCount.value.value;
	}

	findOpenByVisitorToken(visitorToken, options) {
		const query = {
			open: true,
			'v.token': visitorToken,
		};

		return this.find(query, options);
	}

	findOpenByVisitorTokenAndDepartmentId(visitorToken, departmentId, options) {
		const query = {
			open: true,
			'v.token': visitorToken,
			departmentId,
		};

		return this.find(query, options);
	}

	findByVisitorToken(visitorToken) {
		const query = {
			'v.token': visitorToken,
		};

		return this.find(query);
	}

	findByVisitorId(visitorId) {
		const query = {
			'v._id': visitorId,
		};

		return this.find(query);
	}

	findOneOpenByRoomIdAndVisitorToken(roomId, visitorToken, options) {
		const query = {
			_id: roomId,
			open: true,
			'v.token': visitorToken,
		};

		return this.findOne(query, options);
	}

	setResponseByRoomId(roomId, response) {
		return this.update({
			_id: roomId,
		}, {
			$set: {
				responseBy: {
					_id: response.user._id,
					username: response.user.username,
				},
			},
			$unset: {
				waitingResponse: 1,
			},
		});
	}

	saveAnalyticsDataByRoomId(room, message, analyticsData) {
		const update = {
			$set: {},
		};

		if (analyticsData) {
			update.$set['metrics.response.avg'] = analyticsData.avgResponseTime;

			update.$inc = {};
			update.$inc['metrics.response.total'] = 1;
			update.$inc['metrics.response.tt'] = analyticsData.responseTime;
			update.$inc['metrics.reaction.tt'] = analyticsData.reactionTime;
		}

		if (analyticsData && analyticsData.firstResponseTime) {
			update.$set['metrics.response.fd'] = analyticsData.firstResponseDate;
			update.$set['metrics.response.ft'] = analyticsData.firstResponseTime;
			update.$set['metrics.reaction.fd'] = analyticsData.firstReactionDate;
			update.$set['metrics.reaction.ft'] = analyticsData.firstReactionTime;
		}

		// livechat analytics : update last message timestamps
		const visitorLastQuery = (room.metrics && room.metrics.v) ? room.metrics.v.lq : room.ts;
		const agentLastReply = (room.metrics && room.metrics.servedBy) ? room.metrics.servedBy.lr : room.ts;

		if (message.token) {	// update visitor timestamp, only if its new inquiry and not continuing message
			if (agentLastReply >= visitorLastQuery) {		// if first query, not continuing query from visitor
				update.$set['metrics.v.lq'] = message.ts;
			}
		} else if (visitorLastQuery > agentLastReply) {		// update agent timestamp, if first response, not continuing
			update.$set['metrics.servedBy.lr'] = message.ts;
		}

		return this.update({
			_id: room._id,
		}, update);
	}

	getTotalConversationsBetweenDate(t, date) {
		const query = {
			t,
			ts: {
				$gte: new Date(date.gte),	// ISO Date, ts >= date.gte
				$lt: new Date(date.lt),	// ISODate, ts < date.lt
			},
		};

		return this.find(query).count();
	}

	getAnalyticsMetricsBetweenDate(t, date) {
		const query = {
			t,
			ts: {
				$gte: new Date(date.gte),	// ISO Date, ts >= date.gte
				$lt: new Date(date.lt),	// ISODate, ts < date.lt
			},
		};

		return this.find(query, { fields: { ts: 1, departmentId: 1, open: 1, servedBy: 1, metrics: 1, msgs: 1 } });
	}

	closeByRoomId(roomId, closeInfo) {
		return this.update({
			_id: roomId,
		}, {
			$set: {
				closer: closeInfo.closer,
				closedBy: closeInfo.closedBy,
				closedAt: closeInfo.closedAt,
				'metrics.chatDuration': closeInfo.chatDuration,
				'v.status': 'offline',
			},
			$unset: {
				open: 1,
			},
		});
	}

	findOpenByAgent(userId) {
		const query = {
			open: true,
			'servedBy._id': userId,
		};

		return this.find(query);
	}

	changeAgentByRoomId(roomId, newAgent) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				servedBy: {
					_id: newAgent.agentId,
					username: newAgent.username,
					ts: new Date(),
				},
			},
		};

		if (newAgent.ts) {
			update.$set.servedBy.ts = newAgent.ts;
		}

		this.update(query, update);
	}

	changeDepartmentIdByRoomId(roomId, departmentId) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				departmentId,
			},
		};

		this.update(query, update);
	}

	saveCRMDataByRoomId(roomId, crmData) {
		const query = {
			_id: roomId,
		};
		const update = {
			$set: {
				crmData,
			},
		};

		return this.update(query, update);
	}

	updateVisitorStatus(token, status) {
		const query = {
			'v.token': token,
			open: true,
		};

		const update = {
			$set: {
				'v.status': status,
			},
		};

		return this.update(query, update);
	}

	removeAgentByRoomId(roomId) {
		const query = {
			_id: roomId,
		};
		const update = {
			$unset: {
				servedBy: 1,
			},
		};

		this.update(query, update);
	}

	removeByVisitorToken(token) {
		const query = {
			'v.token': token,
		};

		this.remove(query);
	}

	setJitsiTimeout(_id, time) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				jitsiTimeout: time,
			},
		};

		return this.update(query, update);
	}

	findByTokenpass(tokens) {
		const query = {
			'tokenpass.tokens.token': {
				$in: tokens,
			},
		};

		return this._db.find(query).fetch();
	}

	setTokensById(_id, tokens) {
		const update = {
			$set: {
				'tokenpass.tokens.token': tokens,
			},
		};

		return this.update({ _id }, update);
	}

	findAllTokenChannels() {
		const query = {
			tokenpass: { $exists: true },
		};
		const options = {
			fields: {
				tokenpass: 1,
			},
		};
		return this._db.find(query, options);
	}

	setReactionsInLastMessage(roomId, lastMessage) {
		return this.update({ _id: roomId }, { $set: { 'lastMessage.reactions': lastMessage.reactions } });
	}

	unsetReactionsInLastMessage(roomId) {
		return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
	}

	updateLastMessageStar(roomId, cardId, starred) {
		let update;
		const query = { _id: roomId };

		if (starred) {
			update = {
				$addToSet: {
					'lastMessage.starred': { _id: cardId },
				},
			};
		} else {
			update = {
				$pull: {
					'lastMessage.starred': { _id: cardId },
				},
			};
		}

		return this.update(query, update);
	}

	setLastMessageSnippeted(roomId, message, snippetName, snippetedBy, snippeted, snippetedAt) {
		const query =	{ _id: roomId };

		const msg = `\`\`\`${ message.msg }\`\`\``;

		const update = {
			$set: {
				'lastMessage.msg': msg,
				'lastMessage.snippeted': snippeted,
				'lastMessage.snippetedAt': snippetedAt || new Date(),
				'lastMessage.snippetedBy': snippetedBy,
				'lastMessage.snippetName': snippetName,
			},
		};

		return this.update(query, update);
	}

	setLastMessagePinned(roomId, pinnedBy, pinned, pinnedAt) {
		const query = { _id: roomId };

		const update = {
			$set: {
				'lastMessage.pinned': pinned,
				'lastMessage.pinnedAt': pinnedAt || new Date(),
				'lastMessage.pinnedBy': pinnedBy,
			},
		};

		return this.update(query, update);
	}

	setLastMessageAsRead(roomId, cardId) {
		return this.update({
			_id: roomId,
		}, {
			$unset: {
				'lastMessage.unread': 1,
			},
			$addToSet: {
				'lastMessage.reads': cardId,
			},
		});
	}

	setLastMessageReads(roomId, cardId) {
		return this.update({
			_id: roomId,
		}, {
			$addToSet: {
				'lastMessage.reads': cardId,
			},
		});
	}

	setSentiment(roomId, sentiment) {
		return this.update({ _id: roomId }, { $set: { sentiment } });
	}

	setDescriptionById(_id, description) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				description,
			},
		};
		return this.update(query, update);
	}

	setStreamingOptionsById(_id, streamingOptions) {
		const update = {
			$set: {
				streamingOptions,
			},
		};
		return this.update({ _id }, update);
	}

	setTokenpassById(_id, tokenpass) {
		const update = {
			$set: {
				tokenpass,
			},
		};

		return this.update({ _id }, update);
	}

	setReadOnlyById(_id, readOnly, hasPermission) {
		if (!hasPermission) {
			throw new Error('You must provide "hasPermission" function to be able to call this method');
		}
		const query = {
			_id,
		};
		const update = {
			$set: {
				ro: readOnly,
				muted: [],
			},
		};

		if (readOnly) {
			Subscriptions.findByRoomIdWhenCardIdExists(_id, { fields: { 'u._id': 1, c: 1 } }).forEach(function({ u: user, c: card }) {
				if (hasPermission(user._id, 'post-readonly')) {
					return;
				}
				return update.$set.muted.push(card._id);
			});
		} else {
			update.$unset = {
				muted: '',
			};
		}

		if (update.$set.muted.length === 0) {
			delete update.$set.muted;
		}

		return this.update(query, update);
	}

	setAllowReactingWhenReadOnlyById = function(_id, allowReacting) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				reactWhenReadOnly: allowReacting,
			},
		};
		return this.update(query, update);
	}

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.update({ _id }, update);
	}

	unsetAvatarData(_id) {
		const update = {
			$set: {
				avatarETag: Date.now(),
			},
			$unset: {
				avatarOrigin: 1,
			},
		};

		return this.update({ _id }, update);
	}


	setSystemMessagesById = function(_id, systemMessages) {
		const query = {
			_id,
		};
		const update = systemMessages && systemMessages.length > 0 ? {
			$set: {
				sysMes: systemMessages,
			},
		} : {
			$unset: {
				sysMes: '',
			},
		};
		return this.update(query, update);
	}

	setE2eKeyId(_id, e2eKeyId, options) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				e2eKeyId,
			},
		};

		return this.update(query, update, options);
	}

	findOneByImportId(_id, options) {
		const query = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByNonValidatedName(name, options) {
		const room = this.findOneByName(name, options);
		if (room) {
			return room;
		}

		let channelName = s.trim(name);
		try {
			channelName = getValidRoomName(channelName, null, { allowDuplicates: true });
		} catch (e) {
			console.error(e);
		}

		return this.findOneByName(channelName, options);
	}

	findOneByName(name, options) {
		const query = { name };

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = { fname };

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	// FIND

	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: { $in: [].concat(roomIds) } }, options);
	}

	findByType(type, options) {
		const query = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type, ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	findByTypes(types, discussion = false, options = {}) {
		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
		};
		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = { 'u._id': userId };

		return this.find(query, options);
	}

	findBySubscriptionCardId(cardId, options) {
		const data = Subscriptions.findByCardId(cardId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionUserId(userId, options) {
		const data = Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionTypeAndUserId(type, userId, options) {
		const data = Subscriptions.findByUserIdAndType(userId, type, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			t: type,
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
		const ids = Subscriptions.findByUserId(userId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionCardIdUpdatedAfter(cardId, _updatedAt, options) {
		const ids = Subscriptions.findByCardId(cardId, { fields: { rid: 1 } }).fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
			},
		};

		return this.find(query, options);
	}

	findByNameContaining(name, discussion = false, options = {}) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};
		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, discussion = false, options = {}) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};
		return this.find(query, options);
	}

	findByNameAndType(name, type, options) {
		const query = {
			t: type,
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameOrFNameAndType(name, type, options) {
		const query = {
			t: type,
			$or: [{
				name,
			}, {
				fname: name,
			}],
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypeNotDefault(name, type, options) {
		const query = {
			t: type,
			name,
			default: {
				$ne: true,
			},
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypesNotInIds(name, types, ids, options) {
		const query = {
			_id: {
				$ne: ids,
			},
			t: {
				$in: types,
			},
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ s.trim(escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
		};

		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findDirectRoomContainingAllUsernames(usernames, options) {
		const query = {
			t: 'd',
			usernames: { $size: usernames.length, $all: usernames },
			usersCount: usernames.length,
		};

		return this.findOne(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(uid, options) {
		const query = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne(query, options);
	}

	findOneDirectRoomContainingAllCardIDs(cardIds, options) {
		const query = {
			t: 'd',
			cardIds: { $size: cardIds.length, $all: cardIds },
		};

		return this.findOne(query, options);
	}

	findByTypeAndName(type, name, options) {
		const query = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameOrId(type, identifier, options) {
		const query = {
			t: type,
			$or: [
				{ name: identifier },
				{ _id: identifier },
			],
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameContaining(type, name, options) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeInIdsAndNameContaining(type, ids, name, options) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			_id: {
				$in: ids,
			},
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {
		const query = { t: type };

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = { $ne: true };
		}

		return this.find(query, options);
	}

	findGroupDMsByUids(uids, options) {
		return this.find({
			usersCount: { $gt: 2 },
			uids,
		}, options);
	}

	findGroupDMsByCardIds(cardIds, options) {
		return this.find({
			usersCount: { $gt: 2 },
			cardIds,
		}, options);
	}

	find1On1ByCardId(cardId, options) {
		return this.find({
			uids: cardId,
			usersCount: 2,
		}, options);
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);
		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.update(query, update);
	}

	archiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: true,
			},
		};

		return this.update(query, update);
	}

	unarchiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: false,
			},
		};

		return this.update(query, update);
	}

	setNameById(_id, name, fname) {
		const query = { _id };

		const update = {
			$set: {
				name,
				fname,
			},
		};

		return this.update(query, update);
	}

	setFnameById(_id, fname) {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};

		return this.update(query, update);
	}

	incMsgCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				msgs: inc,
			},
		};

		return this.update(query, update);
	}

	incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
		if (inc == null) { inc = 1; }
		const query = { _id };

		const update = {
			$set: {
				lm: lastMessageTimestamp,
			},
			$inc: {
				msgs: inc,
			},
		};

		if (lastMessage) {
			update.$set.lastMessage = lastMessage;
		}

		return this.update(query, update);
	}

	decreaseMessageCountById(_id, count = 1) {
		return this.incMsgCountById(_id, -count);
	}

	incUsersCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update);
	}

	incUsersCountNotDMsByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
			t: { $ne: 'd' },
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLastMessageById(_id, lastMessage) {
		const query = { _id };

		const update = {
			$set: {
				lastMessage,
			},
		};

		return this.update(query, update);
	}

	resetLastMessageById(_id, messageId) {
		const query = { _id };
		const lastMessage = Messages.getLastVisibleMessageSentWithNoTypeByRoomId(_id, messageId);

		const update = lastMessage ? {
			$set: {
				lastMessage,
			},
		} : {
			$unset: {
				lastMessage: 1,
			},
		};

		return this.update(query, update);
	}

	replaceUsername(previousUsername, username) {
		const query = { usernames: previousUsername };

		const update = {
			$set: {
				'usernames.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceMutedUsername(previousUsername, username) {
		const query = { muted: previousUsername };

		const update = {
			$set: {
				'muted.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceUsernameOfUserByUserId(userId, username) {
		const query = { 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceUsernameOfCardByCardId(cardId, username) {
		const query = { 'c._id': cardId };

		const update = {
			$set: {
				'c.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setJoinCodeById(_id, joinCode) {
		let update;
		const query = { _id };

		if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode,
				},
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false,
				},
				$unset: {
					joinCode: 1,
				},
			};
		}

		return this.update(query, update);
	}

	setUserById(_id, user) {
		const query = { _id };

		const update = {
			$set: {
				u: {
					_id: user._id,
					username: user.username,
				},
			},
		};

		return this.update(query, update);
	}

	setTypeById(_id, type) {
		const query = { _id };
		const update = {
			$set: {
				t: type,
			},
		};
		if (type === 'p') {
			update.$unset = { default: '' };
		}

		return this.update(query, update);
	}

	setTopicById(_id, topic) {
		const query = { _id };

		const update = {
			$set: {
				topic,
			},
		};

		return this.update(query, update);
	}

	setAnnouncementById(_id, announcement, announcementDetails) {
		const query = { _id };

		const update = {
			$set: {
				announcement,
				announcementDetails,
			},
		};

		return this.update(query, update);
	}

	setCustomFieldsById(_id, customFields) {
		const query = { _id };

		const update = {
			$set: {
				customFields,
			},
		};

		return this.update(query, update);
	}

	muteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$addToSet: {
				muted: username,
			},
			$pull: {
				unmuted: username,
			},
		};

		return this.update(query, update);
	}

	unmuteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$pull: {
				muted: username,
			},
			$addToSet: {
				unmuted: username,
			},
		};

		return this.update(query, update);
	}

	muteCardIdByRoomId(_id, cardId) {
		const query = { _id };

		const update = {
			$addToSet: {
				muted: cardId,
			},
		};

		return this.update(query, update);
	}

	unmuteCardIdByRoomId(_id, cardId) {
		const query = { _id };

		const update = {
			$pull: {
				muted: cardId,
			},
		};

		return this.update(query, update);
	}

	saveFeaturedById(_id, featured) {
		const query = { _id };
		const set = ['true', true].includes(featured);

		const update = {
			[set ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.update(query, update);
	}

	saveDefaultById(_id, defaultValue) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue,
			},
		};

		return this.update(query, update);
	}

	saveFavoriteById(_id, favorite, defaultValue) {
		const query = { _id };

		const update = {
			...favorite && defaultValue && { $set: { favorite } },
			...(!favorite || !defaultValue) && { $unset: {	favorite: 1 } },
		};

		return this.update(query, update);
	}

	saveRetentionEnabledById(_id, value) {
		const query = { _id };

		const update = {};

		if (value == null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.update(query, update);
	}

	saveRetentionMaxAgeById(_id, value) {
		const query = { _id };

		value = Number(value);
		if (!value) {
			value = 30;
		}

		const update = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.update(query, update);
	}

	saveRetentionExcludePinnedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionIgnoreThreadsById(_id, value) {
		const query = { _id };

		const update = {
			[value === true ? '$set' : '$unset']: {
				'retention.ignoreThreads': true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionFilesOnlyById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionOverrideGlobalById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.update(query, update);
	}

	saveEncryptedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.update(query, update);
	}

	updateGroupDMsRemovingUsernamesByUsername(username) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $gt: 2 },
		};

		const update = {
			$pull: {
				usernames: username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setTopicAndTagsById(_id, topic, tags) {
		const setData = {};
		const unsetData = {};

		if (topic != null) {
			if (!_.isEmpty(s.trim(topic))) {
				setData.topic = s.trim(topic);
			} else {
				unsetData.topic = 1;
			}
		}

		if (tags != null) {
			if (!_.isEmpty(s.trim(tags))) {
				setData.tags = s.trim(tags).split(',').map((tag) => s.trim(tag));
			} else {
				unsetData.tags = 1;
			}
		}

		const update = {};

		if (!_.isEmpty(setData)) {
			update.$set = setData;
		}

		if (!_.isEmpty(unsetData)) {
			update.$unset = unsetData;
		}

		if (_.isEmpty(update)) {
			return;
		}

		return this.update({ _id }, update);
	}

	// INSERT
	createWithTypeNameUserAndUsernames(type, name, fname, user, usernames, extraData) {
		const room = {
			name,
			fname,
			t: type,
			usernames,
			msgs: 0,
			usersCount: 0,
			adhoc: false,
			u: {
				_id: user._id,
				username: user.username,
			},
		};

		_.extend(room, extraData);

		room._id = this.insert(room);
		return room;
	}

	createWithIdTypeAndName(_id, type, name, extraData) {
		const room = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0,
			usersCount: 0,
			adhoc: false,
		};

		_.extend(room, extraData);

		this.insert(room);
		return room;
	}

	createWithFullRoomData(room) {
		delete room._id;

		room._id = this.insert(room);
		return room;
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}

	removeByIds(ids) {
		return this.remove({ _id: { $in: ids } });
	}

	removeDirectRoomContainingUsername(username) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $lte: 2 },
		};

		return this.remove(query);
	}

	// ############################
	// Discussion
	findDiscussionParentByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${ s.trim(escapeRegExp(name)) }`, 'i');

		const query = {
			t: {
				$in: ['c'],
			},
			name: nameRegex,
			archived: { $ne: true },
			prid: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	setLinkMessageById(_id, linkMessageId) {
		const query = { _id };

		const update = {
			$set: {
				linkMessageId,
			},
		};

		return this.update(query, update);
	}

	countDiscussions() {
		return this.find({ prid: { $exists: true } }).count();
	}
}

export default new Rooms('room', true);

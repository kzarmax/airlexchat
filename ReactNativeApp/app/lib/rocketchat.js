import { InteractionManager } from 'react-native';
import semver from 'semver';
import { Rocketchat as RocketchatClient, settings as RocketChatSettings } from '@rocket.chat/sdk';
import { Q } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-community/async-storage';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import RNFetchBlob from 'rn-fetch-blob';

import { orderBy } from 'lodash';
import reduxStore from './createStore';
import defaultSettings from '../constants/settings';
import settings from '../constants/settings';
import database from './database';
import log, { LOG_L_LOW } from '../utils/log';
import { getBundleId, isIOS } from '../utils/deviceInfo';
import fetch from '../utils/fetch';
import SSLPinning from '../utils/sslPinning';

import { encryptionInit } from '../actions/encryption';
import { loginRequest, setLoginServices, setUser } from '../actions/login';
import { connectRequest, connectSuccess, disconnect } from '../actions/connect';
import { shareSelectServer, shareSetSettings, shareSetUser } from '../actions/share';

import subscribeRooms from './methods/subscriptions/rooms';
import getUsersPresence, { getUserPresence, subscribeUsersPresence } from './methods/getUsersPresence';

import protectedFunction from './methods/helpers/protectedFunction';
import readMessages from './methods/readMessages';
import getSettings, { getLoginSettings, setSettings } from './methods/getSettings';

import getRooms from './methods/getRooms';
import getPermissions from './methods/getPermissions';
import { getCustomEmojis, setCustomEmojis } from './methods/getCustomEmojis';
import { getPointProfiles, purchasedPoints, setPointProfiles } from './methods/pointProfiles';
import { confirmPaymentIntent, createCharge, createPaymentIntent } from './methods/stripe';
import {
	getEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
	setEnterpriseModules
} from './methods/enterpriseModules';
import getSlashCommands from './methods/getSlashCommands';
import getRoles from './methods/getRoles';
import canOpenRoom from './methods/canOpenRoom';
import triggerBlockAction, { triggerCancel, triggerSubmitView } from './methods/actions';

import loadMessagesForRoom from './methods/loadMessagesForRoom';
import loadMissedMessages from './methods/loadMissedMessages';
import loadThreadMessages from './methods/loadThreadMessages';

import sendMessage, { resendMessage } from './methods/sendMessage';
import {
	cancelUpload, isUploadActive, sendFileMessage, uploadFile
} from './methods/sendFileMessage';

import callJitsi from './methods/callJitsi';
import logout, { removeServer } from './methods/logout';

import { getDeviceToken } from '../notifications/push';
import { setActiveUsers } from '../actions/activeUsers';
import I18n from '../i18n';
import { twoFactor } from '../utils/twoFactor';
import { selectServerFailure } from '../actions/server';
import { useSsl } from '../utils/url';
import UserPreferences from './userPreferences';
import { Encryption } from './encryption';
import EventEmitter from '../utils/events';
import { sanitizeLikeString } from './database/utils';

import { setCards as setCardsAction } from '../actions/cards';
import { DEFAULT_SERVER } from '../constants/servers';

const TOKEN_KEY = 'reactnativemeteor_usertoken';
const CURRENT_SERVER = 'currentServer';
const SORT_PREFS_KEY = 'RC_SORT_PREFS_KEY';
const CERTIFICATE_KEY = 'RC_CERTIFICATE_KEY';
const TEXT_SIZE = 'textsize';
export const THEME_PREFERENCES_KEY = 'RC_THEME_PREFERENCES_KEY';
export const CRASH_REPORT_KEY = 'RC_CRASH_REPORT_KEY';
export const ANALYTICS_EVENTS_KEY = 'RC_ANALYTICS_EVENTS_KEY';
const returnAnArray = obj => obj || [];
const MIN_ROCKETCHAT_VERSION = '0.70.0';

const STATUSES = ['offline', 'online', 'away', 'busy'];

const RocketChat = {
	TOKEN_KEY,
	CURRENT_SERVER,
	CERTIFICATE_KEY,
	TEXT_SIZE,
	callJitsi,
	async subscribeRooms() {
		if (!this.roomsSub) {
			try {
				this.roomsSub = await subscribeRooms.call(this);
			} catch (e) {
				log(e);
			}
		}
	},
	unsubscribeRooms() {
		if (this.roomsSub) {
			this.roomsSub.stop();
			this.roomsSub = null;
		}
	},
	canOpenRoom,
	createChannel({
		name, cardId, users, type, readOnly, broadcast, encrypted
	}) {
		// RC 0.51.0
		return this.methodCallWrapper(type ? 'createPrivateGroup' : 'createChannel', name, cardId, users, readOnly, {}, { broadcast, encrypted });
	},
	async getWebsocketInfo({ server }) {
		const sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

		try {
			await sdk.connect();
		} catch (err) {
			if (err.message && err.message.includes('400')) {
				return {
					success: false,
					message: I18n.t('Websocket_disabled', { contact: I18n.t('Contact_your_server_admin') })
				};
			}
		}

		sdk.disconnect();

		return {
			success: true
		};
	},
	async testServer(server) {
		try {
			const result = await fetch(`${ server }/api/v1/info`).then(response => response.json());
			if (result.success && result.info) {
				if (semver.lt(result.info.version, MIN_ROCKETCHAT_VERSION)) {
					return {
						success: false,
						message: 'Invalid_server_version',
						messageOptions: {
							currentVersion: result.info.version,
							minVersion: MIN_ROCKETCHAT_VERSION
						}
					};
				}

				return {
					success: true,
					versions: result.versions
				};
			}
		} catch (e) {
			log(e, 'Test Server Error');
		}
		return {
			success: false,
			message: 'The_URL_is_invalid'
		};
	},
	async getServerInfo(server) {
		try {
			const response = await RNFetchBlob.fetch('GET', `${ server }/api/info`, { ...RocketChatSettings.customHeaders });
			try {
				// Try to resolve as json
				const jsonRes = response.json();
				if (!(jsonRes?.success)) {
					return {
						success: false,
						message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
					};
				}
				if (semver.lt(jsonRes.version, MIN_ROCKETCHAT_VERSION)) {
					return {
						success: false,
						message: I18n.t('Invalid_server_version', {
							currentVersion: jsonRes.version,
							minVersion: MIN_ROCKETCHAT_VERSION
						})
					};
				}
				return jsonRes;
			} catch (error) {
				// Request is successful, but response isn't a json
			}
		} catch (e) {
			if (e?.message) {
				if (e.message === 'Aborted') {
					reduxStore.dispatch(selectServerFailure());
					throw e;
				}
				return {
					success: false,
					message: e.message
				};
			}
		}

		return {
			success: false,
			message: I18n.t('Not_RC_Server', { contact: I18n.t('Contact_your_server_admin') })
		};
	},
	stopListener(listener) {
		return listener && listener.stop();
	},
	// Abort all requests and create a new AbortController
	abort() {
		if (this.controller) {
			this.controller.abort();
			if (this.sdk) {
				this.sdk.abort();
			}
		}
		this.controller = new AbortController();
	},
	connect({ server, user, logoutOnError = false }) {
		return new Promise((resolve) => {
			if (!this.sdk || this.sdk.client.host !== server) {
				database.setActiveDB(server);
			}
			reduxStore.dispatch(connectRequest());

			if (this.connectTimeout) {
				clearTimeout(this.connectTimeout);
			}

			if (this.connectedListener) {
				this.connectedListener.then(this.stopListener);
			}

			if (this.closeListener) {
				this.closeListener.then(this.stopListener);
			}

			if (this.usersListener) {
				this.usersListener.then(this.stopListener);
			}

			if (this.notifyLoggedListener) {
				this.notifyLoggedListener.then(this.stopListener);
			}
			this.unsubscribeRooms();

			EventEmitter.emit('INQUIRY_UNSUBSCRIBE');
			if (this.sdk) {
				this.sdk.disconnect();
				this.sdk = null;
			}

			if (this.code) {
				this.code = null;
			}
			this.sdk = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });
			this.getSettings();

			const sdkConnect = () => this.sdk.connect()
				.then(() => {
					const { server: currentServer } = reduxStore.getState().server;
					if (user && user.token && server === currentServer) {
						reduxStore.dispatch(loginRequest({ resume: user.token }, logoutOnError));
					}
				})
				.catch((err) => {
					console.log('connect error', err);

					// when `connect` raises an error, we try again in 10 seconds
					this.connectTimeout = setTimeout(() => {
						if (this.sdk?.client?.host === server) {
							sdkConnect();
						}
					}, 10000);
				});

			sdkConnect();

			this.connectedListener = this.sdk.onStreamData('connected', () => {
				reduxStore.dispatch(connectSuccess());
			});

			this.closeListener = this.sdk.onStreamData('close', () => {
				reduxStore.dispatch(disconnect());
			});

			this.usersListener = this.sdk.onStreamData('users', protectedFunction(ddpMessage => RocketChat._setUser(ddpMessage)));

			this.notifyLoggedListener = this.sdk.onStreamData('stream-notify-logged', protectedFunction(async(ddpMessage) => {
				const { eventName } = ddpMessage.fields;
				if (/user-status/.test(eventName)) {
					this.activeUsers = this.activeUsers || {};
					if (!this._setUserTimer) {
						this._setUserTimer = setTimeout(() => {
							const activeUsersBatch = this.activeUsers;
							InteractionManager.runAfterInteractions(() => {
								reduxStore.dispatch(setActiveUsers(activeUsersBatch));
							});
							this._setUserTimer = null;
							return this.activeUsers = {};
						}, 10000);
					}
					const userStatus = ddpMessage.fields.args[0];
					const [id,, status, statusText] = userStatus;
					this.activeUsers[id] = { status: STATUSES[status], statusText };

					const { user: loggedUser } = reduxStore.getState().login;
					if (loggedUser && loggedUser.id === id) {
						reduxStore.dispatch(setUser({ status: STATUSES[status], statusText }));
					}
				} else if (/updateAvatar/.test(eventName)) {
					const { _id, etag } = ddpMessage.fields.args[0];
					const db = database.active;
					const cardCollection = db.collections.get('cards');
					try {
						const cardRecord = await cardCollection.find(_id);
						await db.action(async() => {
							await cardRecord.update((c) => {
								c.avatarETag = etag;
							});
						});
					} catch {
						// Card not found
						await db.action(async() => {
							await cardCollection.create((c) => {
								c._raw = sanitizedRaw({ id: _id }, cardCollection.schema);
								Object.assign(c, { _id, avatarETag: etag });
							});
						});
					}
				} else if (/Users:NameChanged/.test(eventName)) {
					const cardNameChanged = ddpMessage.fields.args[0];
					const db = database.active;
					const cardCollection = db.collections.get('cards');
					try {
						const cardRecord = await cardCollection.find(cardNameChanged._id);
						await db.action(async() => {
							await cardRecord.update((c) => {
								Object.assign(c, cardNameChanged);
							});
						});
					} catch {
						// Card not found
						await db.action(async() => {
							await cardCollection.create((c) => {
								c._raw = sanitizedRaw({ id: cardNameChanged._id }, cardCollection.schema);
								Object.assign(c, cardNameChanged);
							});
						});
					}
				}
			}));

			resolve();
		});
	},

	async shareExtensionInit(server) {
		database.setShareDB(server);

		try {
			const certificate = await UserPreferences.getStringAsync(`${ RocketChat.CERTIFICATE_KEY }-${ server }`);
			await SSLPinning.setCertificate(certificate, server);
		} catch {
			// Do nothing
		}

		if (this.shareSDK) {
			this.shareSDK.disconnect();
			this.shareSDK = null;
		}

		this.shareSDK = new RocketchatClient({ host: server, protocol: 'ddp', useSsl: useSsl(server) });

		// set Server
		const currentServer = { server };
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		try {
			const serverRecord = await serversCollection.find(server);
			currentServer.version = serverRecord.version;
		} catch {
			// Record not found
		}
		reduxStore.dispatch(shareSelectServer(currentServer));

		// set User info
		const userId = await UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ server }`);
		const userCollections = serversDB.collections.get('users');
		let user = null;
		if (userId) {
			// version < 1.2.0
			if (userId.length > 17) {
				user = JSON.parse(userId);
			} else {
				const userRecord = await userCollections.find(userId);
				user = {
					id: userRecord.id,
					token: userRecord.token,
					username: userRecord.username,
					roles: userRecord.roles
				};
			}
		}

		reduxStore.dispatch(shareSetUser(user));
		RocketChat.setCards(user?.id);

		RocketChat.setCustomEmojis();
		try {
			// set Settings
			const db = database.active;
			const settingsCollection = db.collections.get('settings');
			const settingsRecords = await settingsCollection.query(Q.where('id', Q.oneOf(Object.keys(settings)))).fetch();
			const parsed = Object.values(settingsRecords).map(item => ({
				_id: item.id,
				valueAsString: item.valueAsString,
				valueAsBoolean: item.valueAsBoolean,
				valueAsNumber: item.valueAsNumber,
				valueAsArray: item.valueAsArray,
				_updatedAt: item._updatedAt
			}));
			reduxStore.dispatch(shareSetSettings(this.parseSettings(parsed)));

			await RocketChat.login({ resume: user?.token });
			reduxStore.dispatch(encryptionInit());
		} catch (e) {
			log(e, 'shareExtensionInit Error:');
		}
	},
	closeShareExtension() {
		if (this.shareSDK) {
			this.shareSDK.disconnect();
			this.shareSDK = null;
		}
		database.share = null;

		reduxStore.dispatch(shareSelectServer({}));
		reduxStore.dispatch(shareSetUser({}));
		reduxStore.dispatch(shareSetSettings({}));
	},

	async e2eFetchMyKeys() {
		// RC 0.70.0
		const sdk = this.shareSDK || this.sdk;
		const result = await sdk.get('e2e.fetchMyKeys');
		// snake_case -> camelCase
		if (result.success) {
			return {
				success: result.success,
				publicKey: result.public_key,
				privateKey: result.private_key
			};
		}
		return result;
	},
	async e2eDecryptByNodeJSCrypto(encrypted, private_key) {
		const sdk = this.shareSDK || this.sdk;
		const result = await sdk.post('e2e.decryptByNodeJSCrypto', { encrypted, private_key });
		if (result && result.success) {
			return result.decrypted;
		}
		return '';
	},
	e2eSetUserPublicAndPrivateKeys(public_key, private_key) {
		// RC 2.2.0
		return this.post('e2e.setUserPublicAndPrivateKeys', { public_key, private_key });
	},
	e2eRequestSubscriptionKeys() {
		// RC 0.72.0
		return this.methodCallWrapper('e2e.requestSubscriptionKeys');
	},
	e2eGetUsersOfRoomWithoutKey(rid) {
		// RC 0.70.0
		return this.sdk.get('e2e.getUsersOfRoomWithoutKey', { rid });
	},
	e2eSetRoomKeyID(rid, keyID) {
		// RC 0.70.0
		return this.post('e2e.setRoomKeyID', { rid, keyID });
	},
	e2eUpdateGroupKey(uid, rid, key) {
		// RC 0.70.0
		return this.post('e2e.updateGroupKey', { uid, rid, key });
	},
	e2eRequestRoomKey(rid, e2eKeyId) {
		// RC 0.70.0
		return this.methodCallWrapper('stream-notify-room-users', `${ rid }/e2ekeyRequest`, rid, e2eKeyId);
	},
	e2eResetOwnKey() {
		this.unsubscribeRooms();

		// RC 0.72.0
		return this.methodCallWrapper('e2e.resetOwnE2EKey');
	},

	updateJitsiTimeout(roomId) {
		// RC 0.74.0
		return this.post('video-conference/jitsi.update-timeout', { roomId });
	},

	createJitsiCall(rid, cardId, onlyAudio) {
		return this.methodCallWrapper('jitsi:updateTimeout', rid, cardId, onlyAudio);
	},

	endJitsiCall(rid, cardId, onlyAudio) {
		return this.methodCallWrapper('jitsi:endTimeout', rid, cardId, onlyAudio);
	},

	register(credentials) {
		// RC 0.50.0
		return this.post('users.register', credentials, false);
	},

	forgotPassword(email) {
		// RC 0.64.0
		return this.post('users.forgotPassword', { email }, false);
	},

	/**
	 *
	 * @param password
	 * @param cardId
	 * @returns {Promise<any>}
	 */
	resetCardPassword(password, cardId) {
		// RC 0.64.0
		return this.post('cards.resetPassword', { password, cardId }, false);
	},

	loginTOTP(params, loginEmailPassword) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.login(params, loginEmailPassword);
				return resolve(result);
			} catch (e) {
				if (e.data?.error && (e.data.error === 'totp-required' || e.data.error === 'totp-invalid')) {
					const { details } = e.data;
					try {
						reduxStore.dispatch(setUser({ username: params.user || params.username }));
						const code = await twoFactor({ method: details?.method || 'totp', invalid: e.data.error === 'totp-invalid' });

						// Force normalized params for 2FA starting RC 3.9.0.
						const user = params.user ?? params.username;
						const password = params.password ?? params.ldapPass ?? params.crowdPassword;
						params = { user, password };

						return resolve(this.loginTOTP({ ...params, code: code?.twoFactorCode }, loginEmailPassword));
					} catch {
						// twoFactor was canceled
						return reject();
					}
				} else {
					reject(e);
				}
			}
		});
	},

	loginWithPassword({ user, password }) {
		let params = { user, password };
		const state = reduxStore.getState();

		if (state.settings.LDAP_Enable) {
			params = {
				username: user,
				ldapPass: password,
				ldap: true,
				ldapOptions: {}
			};
		} else if (state.settings.CROWD_Enable) {
			params = {
				username: user,
				crowdPassword: password,
				crowd: true
			};
		}

		return this.loginTOTP(params, true);
	},

	async loginOAuthOrSso(params) {
		const result = await this.login(params);
		reduxStore.dispatch(loginRequest({ resume: result.token }));
	},

	async login(params, loginEmailPassword) {
		const sdk = this.shareSDK || this.sdk;
		// RC 0.64.0
		await sdk.login(params);
		const { result } = sdk.currentLogin;
		const textsize = await UserPreferences.getStringAsync(TEXT_SIZE);
		return {
			id: result.userId,
			token: result.authToken,
			username: result.me.username,
			name: result.me.name,
			language: result.me.language,
			services: result.me.services,
			textsize,
			status: result.me.status,
			statusText: result.me.statusText,
			customFields: result.me.customFields,
			statusLivechat: result.me.statusLivechat,
			emails: result.me.emails,
			roles: result.me.roles,
			agree: result.me.agree,
			emojis: result.me.emojis ?? [],
			points: result.me.points ?? 0,
			cardCreated: result.me.cardCreated,
			deviceInfo: result.me.deviceInfo,
			avatarETag: result.me.avatarETag,
			loginEmailPassword,
			showMessageInMainThread: result.me.settings?.preferences?.showMessageInMainThread ?? true,
			serverUrl: result.me.server ?? DEFAULT_SERVER
		};
	},
	logout,
	logoutOtherLocations() {
		const { id: userId } = reduxStore.getState().login.user;
		return this.sdk.post('users.removeOtherTokens', { userId });
	},
	removeServer,
	async clearCache({ server }) {
		try {
			const serversDB = database.servers;
			await serversDB.action(async() => {
				const serverCollection = serversDB.collections.get('servers');
				const serverRecord = await serverCollection.find(server);
				await serverRecord.update((s) => {
					s.roomsUpdatedAt = null;
				});
			});
		} catch (e) {
			// Do nothing
		}

		try {
			const db = database.active;
			await db.action(() => db.unsafeResetDatabase());
		} catch (e) {
			// Do nothing
		}
	},
	/**
	 * アカウント登録認証メールの送信（認証の有効期限が切れたユーザー向け）
	 *
	 * @return Boolean success 成否
	 */
	sendRegisterEmail(email) {
		// RC 0.64.0
		return this.post('users.sendRegisterEmail', { email }, false);
	},

	setDeviceInfo(deviceInfo) {
		return this.post('users.setDeviceInfo', { deviceInfo });
	},
	/**
	 * ユーザーアカウントを削除する
	 *
	 * @return Boolean success 成否
	 */
	deleteAccount(userId) {
		return this.post('users.delete', { userId });
	},
	/**
	 * ユーザーアカウントを削除する
	 *
	 * @param  String password パスワード
	 * @return Boolean success 成否
	 */
	deleteOwnAccount() {
		return this.post('users.deleteOwnAccount', { confirmRelinquish: true });
	},
	registerPushToken() {
		return new Promise(async(resolve) => {
			const token = getDeviceToken();
			if (token) {
				const type = isIOS ? 'apn' : 'gcm';
				const data = {
					value: token,
					type,
					appName: getBundleId
				};
				try {
					// RC 0.60.0
					await this.post('push.token', data);
				} catch (error) {
					console.log(error);
				}
			}
			return resolve();
		});
	},
	removePushToken() {
		const token = getDeviceToken();
		if (token) {
			// RC 0.60.0
			return this.sdk.del('push.token', { token });
		}
		return Promise.resolve();
	},
	loadMissedMessages,
	loadMessagesForRoom,
	loadThreadMessages,
	sendMessage,
	getRooms,
	readMessages,
	resendMessage,

	async localSearch({ text, filterUsers = true, filterRooms = true }) {
		const searchText = text.trim();
		if (searchText === '') {
			return [];
		}
		const db = database.active;
		const likeString = sanitizeLikeString(searchText);
		let data = await db.collections.get('subscriptions').query(
			Q.or(
				Q.where('name', Q.like(`%${ likeString }%`)),
				Q.where('fname', Q.like(`%${ likeString }%`))
			),
			Q.experimentalSortBy('room_updated_at', Q.desc)
		).fetch();

		if (filterUsers && !filterRooms) {
			data = data.filter(item => item.t === 'd' && !RocketChat.isGroupChat(item));
		} else if (!filterUsers && filterRooms) {
			data = data.filter(item => item.t !== 'd' || RocketChat.isGroupChat(item));
		}

		data = data.slice(0, 7);

		data = data.map((sub) => {
			if (sub.t !== 'd') {
				return {
					rid: sub.rid,
					name: sub.name,
					fname: sub.fname,
					avatarETag: sub.avatarETag,
					t: sub.t,
					encrypted: sub.encrypted
				};
			}
			return sub;
		});

		return data;
	},

	async search({
		text, filterUsers = true, filterRooms = true, allCards = false
	}) {
		const searchText = text.trim();

		if (searchText === '') {
			return [];
		}

		const db = database.active;
		const likeString = sanitizeLikeString(searchText);
		// メッセージ検索
		let msg = await db.collections.get('messages').query(Q.where('msg', Q.like(`%${ likeString }%`))).fetch();
		if (filterUsers && !filterRooms) {
			msg = msg.filter(item => item._raw.t === 'd');
		} else if (!filterUsers && filterRooms) {
			msg = msg.filter(item => item._raw.t === 'd');
		}

		msg = orderBy(msg, ['ts'], ['desc']);
		msg = msg.slice(0, 7);
		const msgRid = msg.map(sub => sub._raw.rid);
		LOG_L_LOW('search msg', likeString, msg);

		// 友達検索
		let data = [];
		const { selected, selectAll } = reduxStore.getState().cards;
		let selectQuery = null;

		if (!allCards && !selectAll) {
			if (msgRid.length > 0) {
				selectQuery = Q.and(
					Q.or(
						Q.where('name', Q.like(`%${ likeString }%`)),
						Q.where('rid', Q.oneOf(msgRid))
					),
					Q.where('cardId', selected._id)
				);
			} else {
				selectQuery = Q.and(
					Q.where('name', Q.like(`%${ likeString }%`)),
					Q.where('cardId', selected._id)
				);
			}
		} else if (msgRid.length > 0) {
			selectQuery = Q.or(
				Q.where('name', Q.like(`%${ likeString }%`)),
				Q.where('rid', Q.oneOf(msgRid))
			);
		} else {
			selectQuery = Q.where('name', Q.like(`%${ likeString }%`));
		}

		data = await db.collections.get('subscriptions')
			.query(
				selectQuery
			)
			.fetch();

		if (filterUsers && !filterRooms) {
			data = data.filter(item => item._raw.t === 'd');
		} else if (!filterUsers && filterRooms) {
			data = data.filter(item => item._raw.t !== 'd');
		}

		data = data.slice(0, 7);

		const searchMessages = [];
		// Search Text
		if (msgRid.length > 0) {
			data.forEach((sub) => {
				const searchMessage = msg.find(item => item._raw.rid === sub._raw.rid);
				if (searchMessage) {
					const message = searchMessage._raw.msg;
					const message_id = searchMessage._raw.id;
					const firstIndex = message.indexOf(likeString);

					searchMessages.push({
						id: message_id,
						rid: sub._raw.rid,
						message: firstIndex > 8 ? (`...${ message.substring(firstIndex - 6, message.length) }`) : message
					});
				}
			});
		}

		return {
			data,
			search_messages: searchMessages
		};
	},

	spotlight(search, usernames, type) {
		// RC 0.51.0
		return this.methodCallWrapper('spotlight', search, usernames, type);
	},

	createDirectMessage(cardId, friendCardId) {
		// RC 0.59.0
		return this.post('im.create', { cardId, friendCardId });
	},

	createDiscussion({
		prid, pmid, t_name, reply, users, encrypted
	}) {
		// RC 1.0.0
		return this.post('rooms.createDiscussion', {
			prid, pmid, t_name, reply, users, encrypted
		});
	},

	joinRoom(roomId, type) {
		// TODO: join code
		// RC 0.48.0
		if (type === 'p') {
			return this.methodCallWrapper('joinRoom', roomId);
		}
		return this.post('channels.join', { roomId });
	},
	triggerBlockAction,
	triggerSubmitView,
	triggerCancel,
	sendFileMessage,
	uploadFile,
	cancelUpload,
	isUploadActive,
	getSettings,
	getLoginSettings,
	setSettings,
	getPermissions,
	getCustomEmojis,
	setCustomEmojis,
	getPointProfiles,
	purchasedPoints,
	setPointProfiles,
	createCharge,
	createPaymentIntent,
	confirmPaymentIntent,
	getEnterpriseModules,
	setEnterpriseModules,
	hasLicense,
	isOmnichannelModuleAvailable,
	getSlashCommands,
	getRoles,
	parseSettings: settings => settings.reduce((ret, item) => {
		ret[item._id] = defaultSettings[item._id] && item[defaultSettings[item._id].type];
		if (item._id === 'Hide_System_Messages') {
			ret[item._id] = ret[item._id]
				.reduce((array, value) => [...array, ...value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value]], []);
		}
		return ret;
	}, {}),
	_prepareSettings(settings) {
		return settings.map((setting) => {
			setting[defaultSettings[setting._id].type] = setting.value;
			return setting;
		});
	},
	deleteMessage(messageId, rid, cardId) {
		// RC 0.48.0
		return this.post('chat.delete', { msgId: messageId, roomId: rid, cardId });
	},
	async editMessage(message) {
		if (message.t && message.t === 'e2e') {
			const { rid, msg, cardId } = await Encryption.encryptMessage(message);
			return this.post('chat.update', {
				roomId: rid, msgId: message.id, cardId, text: msg
			});
		}
		const { rid, msg, cardId } = message;
		// RC 0.49.0
		return this.post('chat.update', {
			roomId: rid, msgId: message.id, cardId, text: msg
		});
	},
	markAsUnread({ messageId }) {
		return this.post('subscriptions.unread', { firstUnreadMessage: { _id: messageId } });
	},
	toggleStarMessage(messageId, cardId, starred) {
		if (starred) {
			// RC 0.59.0
			return this.post('chat.unStarMessage', { messageId, cardId });
		}
		// RC 0.59.0
		return this.post('chat.starMessage', { messageId, cardId });
	},
	togglePinMessage(messageId, cardId, pinned) {
		if (pinned) {
			// RC 0.59.0
			return this.post('chat.unPinMessage', { messageId, cardId });
		}
		// RC 0.59.0
		return this.post('chat.pinMessage', { messageId, cardId });
	},
	reportMessage(messageId) {
		return this.post('chat.reportMessage', { messageId, description: 'Message reported by user' });
	},
	async getRoom(rid) {
		try {
			const db = database.active;
			const room = await db.collections.get('subscriptions').find(rid);
			return Promise.resolve(room);
		} catch (error) {
			return Promise.reject(new Error('Room not found'));
		}
	},
	async getPermalinkMessage(message, replyText = null) {
		let room;
		try {
			room = await RocketChat.getRoom(message.subscription.id);
		} catch (e) {
			log(e);
			return null;
		}
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[room.t];
		if (replyText) {
			const encodeText = this.getURIEncode(replyText);
			return `${ server }/${ roomType }/${ room.rid }?msg=${ message.id }&txt=${ encodeText }`;
		}
		return `${ server }/${ roomType }/${ room.rid }?msg=${ message.id }`;
	},
	getURIEncode(str) {
		return encodeURIComponent(str).replace(/[!'()*]/g, c => `%${ c.charCodeAt(0).toString(16) }`);
	},
	getPermalinkChannel(channel) {
		const { server } = reduxStore.getState().server;
		const roomType = {
			p: 'group',
			c: 'channel',
			d: 'direct'
		}[channel.t];
		return `${ server }/${ roomType }/${ channel.name }`;
	},
	subscribe(...args) {
		return this.sdk.subscribe(...args);
	},
	subscribeRoom(...args) {
		return this.sdk.subscribeRoom(...args);
	},
	unsubscribe(subscription) {
		return this.sdk.unsubscribe(subscription);
	},
	onStreamData(...args) {
		return this.sdk.onStreamData(...args);
	},
	emitTyping(room, username, typing = true) {
		return this.methodCall('stream-notify-room', `${ room }/typing`, username, typing);
	},
	setUserPresenceAway() {
		return this.methodCall('UserPresence:away');
	},
	setUserPresenceOnline() {
		return this.methodCall('UserPresence:online');
	},
	setUserPreferences(userId, data) {
		// RC 0.62.0
		return this.sdk.post('users.setPreferences', { userId, data });
	},
	setUserStatus(status, message) {
		// RC 1.2.0
		return this.post('users.setStatus', { status, message });
	},
	setReaction(emoji, messageId, cardId) {
		// RC 0.62.2
		return this.post('chat.react', { emoji, messageId, cardId });
	},
	toggleFavorite(roomId, cardId, favorite) {
		// RC 0.64.0
		return this.post('rooms.favorite', { roomId, cardId, favorite });
	},
	toggleRead(read, roomId) {
		if (read) {
			return this.post('subscriptions.unread', { roomId });
		}
		return this.post('subscriptions.read', { rid: roomId });
	},
	getRoomMembers(rid, cardId, allUsers, skip = 0, limit = 50) {
		// RC 0.42.0
		return this.methodCallWrapper('getUsersOfRoom', rid, cardId, allUsers, { skip, limit });
	},

	methodCallWrapper(method, ...params) {
		const { API_Use_REST_For_DDP_Calls } = reduxStore.getState().settings;
		if (API_Use_REST_For_DDP_Calls) {
			return this.post(`method.call/${ method }`, { message: JSON.stringify({ method, params }) });
		}
		return this.methodCall(method, ...params);
	},

	getUserRoles() {
		// RC 0.27.0
		return this.methodCallWrapper('getUserRoles');
	},
	getRoomCounters(roomId, cardId, t) {
		// RC 0.65.0
		return this.sdk.get(`${ this.roomTypeToApiType(t) }.counters`, { roomId, cardId });
	},
	getChannelInfo(roomId) {
		// RC 0.48.0
		return this.sdk.get('channels.info', { roomId });
	},
	getUserInfo(userId) {
		// RC 0.48.0
		return this.sdk.get('users.info', { userId });
	},
	getUserPreferences(userId) {
		// RC 0.62.0
		return this.sdk.get('users.getPreferences', { userId });
	},
	getRoomInfo(roomId, cardId) {
		// RC 0.72.0
		return this.sdk.get('rooms.info', { roomId, cardId });
	},
	getRoomMemberId(rid, currentUserId) {
		if (rid === `${ currentUserId }${ currentUserId }`) {
			return currentUserId;
		}
		return rid.replace(currentUserId, '').trim();
	},
	async getRoomMember(rid, currentCardId) {
		try {
			if (rid === `${ currentCardId }${ currentCardId }`) {
				return await Promise.resolve(currentCardId);
			}
			const membersResult = await RocketChat.getRoomMembers(rid, currentCardId, true);
			return await Promise.resolve(membersResult.records.find(m => m._id !== currentCardId));
		} catch (error) {
			return await Promise.reject(error);
		}
	},

	getVisitorInfo(visitorId) {
		// RC 2.3.0
		return this.sdk.get('livechat/visitors.info', { visitorId });
	},
	closeLivechat(rid, comment) {
		// RC 0.29.0
		return this.methodCallWrapper('livechat:closeRoom', rid, comment, { clientAction: true });
	},
	editLivechat(userData, roomData) {
		// RC 0.55.0
		return this.methodCallWrapper('livechat:saveInfo', userData, roomData);
	},
	returnLivechat(rid) {
		// RC 0.72.0
		return this.methodCallWrapper('livechat:returnAsInquiry', rid);
	},
	forwardLivechat(transferData) {
		// RC 0.36.0
		return this.methodCallWrapper('livechat:transfer', transferData);
	},
	getPagesLivechat(rid, offset) {
		// RC 2.3.0
		return this.sdk.get(`livechat/visitors.pagesVisited/${ rid }?count=50&offset=${ offset }`);
	},
	getDepartmentInfo(departmentId) {
		// RC 2.2.0
		return this.sdk.get(`livechat/department/${ departmentId }?includeAgents=false`);
	},
	getDepartments() {
		// RC 2.2.0
		return this.sdk.get('livechat/department');
	},
	usersAutoComplete(selector) {
		// RC 2.4.0
		return this.sdk.get('users.autocomplete', { selector });
	},
	getRoutingConfig() {
		// RC 2.0.0
		return this.methodCallWrapper('livechat:getRoutingConfig');
	},
	getTagsList() {
		// RC 2.0.0
		return this.methodCallWrapper('livechat:getTagsList');
	},
	getAgentDepartments(uid) {
		// RC 2.4.0
		return this.sdk.get(`livechat/agents/${ uid }/departments?enabledDepartmentsOnly=true`);
	},
	getCustomFields() {
		// RC 2.2.0
		return this.sdk.get('livechat/custom-fields');
	},

	getUidDirectMessage(room) {
		if (!room) {
			return false;
		}

		if (RocketChat.isGroupChat(room)) {
			return false;
		}

		return room.o && room.o.userId;
	},

	isRead(item) {
		let isUnread = item.archived !== true && item.open === true; // item is not archived and not opened
		isUnread = isUnread && (item.unread > 0 || item.alert === true); // either its unread count > 0 or its alert
		return !isUnread;
	},

	isGroupChat(room) {
		return room.t === 'p' || room.t === 'c';
	},

	toggleBlockUser(rid, cardId, blocked, block) {
		if (block) {
			// RC 0.49.0
			return this.methodCallWrapper('blockUser', { rid, cardId, blocked });
		}
		// RC 0.49.0
		return this.methodCallWrapper('unblockUser', { rid, cardId, blocked });
	},
	leaveRoom(roomId, t, cardId) {
		// RC 0.48.0
		return this.post(`${ this.roomTypeToApiType(t) }.leave`, { roomId, cardId });
	},
	deleteRoom(roomId, t, cardId) {
		// RC 0.49.0
		return this.post(`${ this.roomTypeToApiType(t) }.delete`, { roomId, cardId });
	},
	toggleMuteUserInRoom(rid, username, mute) {
		if (mute) {
			// RC 0.51.0
			return this.methodCallWrapper('muteUserInRoom', { rid, username });
		}
		// RC 0.51.0
		return this.methodCallWrapper('unmuteUserInRoom', { rid, username });
	},
	toggleRoomOwner({
		roomId, t, userId, isOwner
	}) {
		if (isOwner) {
			// RC 0.49.4
			return this.post(`${ this.roomTypeToApiType(t) }.addOwner`, { roomId, userId });
		}
		// RC 0.49.4
		return this.post(`${ this.roomTypeToApiType(t) }.removeOwner`, { roomId, userId });
	},
	toggleRoomLeader({
		roomId, t, userId, isLeader
	}) {
		if (isLeader) {
			// RC 0.58.0
			return this.post(`${ this.roomTypeToApiType(t) }.addLeader`, { roomId, userId });
		}
		// RC 0.58.0
		return this.post(`${ this.roomTypeToApiType(t) }.removeLeader`, { roomId, userId });
	},
	toggleRoomModerator({
		roomId, t, userId, isModerator
	}) {
		if (isModerator) {
			// RC 0.49.4
			return this.post(`${ this.roomTypeToApiType(t) }.addModerator`, { roomId, userId });
		}
		// RC 0.49.4
		return this.post(`${ this.roomTypeToApiType(t) }.removeModerator`, { roomId, userId });
	},
	removeUserFromRoom({
		roomId, t, userId
	}) {
		// RC 0.48.0
		return this.post(`${ this.roomTypeToApiType(t) }.kick`, { roomId, userId });
	},
	ignoreUser({ rid, userId, ignore }) {
		return this.sdk.get('chat.ignoreUser', { rid, userId, ignore });
	},
	toggleArchiveRoom(roomId, t, archive) {
		if (archive) {
			// RC 0.48.0
			return this.post(`${ this.roomTypeToApiType(t) }.archive`, { roomId });
		}
		// RC 0.48.0
		return this.post(`${ this.roomTypeToApiType(t) }.unarchive`, { roomId });
	},
	hideRoom(roomId, t) {
		return this.post(`${ this.roomTypeToApiType(t) }.close`, { roomId });
	},
	saveRoomSettings(rid, cardId, params) {
		// RC 0.55.0
		return this.methodCallWrapper('saveRoomSettings', rid, cardId, params);
	},
	post(...args) {
		return new Promise(async(resolve, reject) => {
			const isMethodCall = args[0]?.startsWith('method.call/');
			try {
				const result = await this.sdk.post(...args);

				/**
				 * if API_Use_REST_For_DDP_Calls is enabled and it's a method call,
				 * responses have a different object structure
				 */
				if (isMethodCall) {
					const response = JSON.parse(result.message);
					if (response?.error) {
						throw response.error;
					}
					return resolve(response.result);
				}
				return resolve(result);
			} catch (e) {
				const errorType = isMethodCall ? e?.error : e?.data?.errorType;
				const totpInvalid = 'totp-invalid';
				const totpRequired = 'totp-required';
				if ([totpInvalid, totpRequired].includes(errorType)) {
					const { details } = isMethodCall ? e : e?.data;
					try {
						await twoFactor({ method: details?.method, invalid: errorType === totpInvalid });
						return resolve(this.post(...args));
					} catch {
						// twoFactor was canceled
						return resolve({});
					}
				} else {
					reject(e);
				}
			}
		});
	},
	methodCall(...args) {
		return new Promise(async(resolve, reject) => {
			try {
				const result = await this.sdk.methodCall(...args, this.code || '');
				return resolve(result);
			} catch (e) {
				if (e.error && (e.error === 'totp-required' || e.error === 'totp-invalid')) {
					const { details } = e;
					try {
						this.code = await twoFactor({ method: details?.method, invalid: e.error === 'totp-invalid' });
						return resolve(this.methodCall(...args));
					} catch {
						// twoFactor was canceled
						return resolve({});
					}
				} else {
					reject(e);
				}
			}
		});
	},
	sendEmailCode() {
		const { username } = reduxStore.getState().login.user;
		// RC 3.1.0
		return this.post('users.2fa.sendEmailCode', { emailOrUsername: username });
	},
	saveUserProfile(data, customFields) {
		// RC 0.62.2
		return this.post('users.updateOwnBasicInfo', { data, customFields });
	},
	saveUserPreferences(data) {
		// RC 0.62.0
		return this.post('users.setPreferences', { data });
	},
	saveNotificationSettings(roomId, cardId, notifications) {
		// RC 0.63.0
		return this.post('rooms.saveNotification', { roomId, cardId, notifications });
	},
	addUsersToRoom(rid) {
		let { users } = reduxStore.getState().selectedUsers;
		users = users.map(u => u.name);
		// RC 0.51.0
		return this.methodCallWrapper('addUsersToRoom', { rid, users });
	},
	getSingleMessage(msgId, cardId) {
		// RC 0.57.0
		return this.sdk.get('chat.getMessage', { msgId, cardId });
	},
	hasRole(role) {
		const shareUser = reduxStore.getState().share.user;
		const loginUser = reduxStore.getState().login.user;
		// get user roles on the server from redux
		const userRoles = (shareUser?.roles || loginUser?.roles) || [];

		return userRoles.indexOf(r => r === role) > -1;
	},
	getRoomRoles(roomId, type) {
		// RC 0.65.0
		return this.sdk.get(`${ this.roomTypeToApiType(type) }.roles`, { roomId });
	},
	async hasPermission(permissions, rid) {
		const db = database.active;
		const subsCollection = db.collections.get('subscriptions');
		const permissionsCollection = db.collections.get('permissions');
		let roomRoles = [];
		try {
			// get the room from database
			const room = await subsCollection.find(rid);
			// get room roles
			roomRoles = room.roles || [];
		} catch (error) {
			console.log('hasPermission -> Room not found');
			return permissions.reduce((result, permission) => {
				result[permission] = false;
				return result;
			}, {});
		}
		// get permissions from database
		try {
			const permissionsFiltered = await permissionsCollection.query(Q.where('id', Q.oneOf(permissions))).fetch();
			const shareUser = reduxStore.getState().share.user;
			const loginUser = reduxStore.getState().login.user;
			// get user roles on the server from redux
			const userRoles = (shareUser?.roles || loginUser?.roles) || [];
			// merge both roles
			const mergedRoles = [...new Set([...roomRoles, ...userRoles])];

			// return permissions in object format
			// e.g. { 'edit-room': true, 'set-readonly': false }
			return permissions.reduce((result, permission) => {
				result[permission] = false;
				const permissionFound = permissionsFiltered.find(p => p.id === permission);
				if (permissionFound) {
					result[permission] = returnAnArray(permissionFound.roles).some(r => mergedRoles.includes(r));
				}
				return result;
			}, {});
		} catch (e) {
			log(e, 'has Permission Error:');
		}
	},
	getAvatarSuggestion() {
		// RC 0.51.0
		return this.methodCallWrapper('getAvatarSuggestion');
	},
	resetAvatar(userId) {
		// RC 0.55.0
		return this.post('users.resetAvatar', { userId });
	},
	setAvatarFromService({ data, contentType = '', service = null }) {
		// RC 0.51.0
		return this.methodCallWrapper('setAvatarFromService', data, contentType, service);
	},
	/**
	 * カードのアバター画像を設定する
	 *
	 * setAvatarFromServiceの替わりに使用してください
	 * @return
	 */
	setCardAvatarFromService({
		cardId, data, contentType = '', service = null
	}) {
		return this.methodCallWrapper('setCardAvatarFromService', cardId, data, contentType, service);
	},
	/**
	 * グループのアバター画像を設定する
	 *
	 * @return
	 */
	setGroupAvatar({
		rid, cardId, data, contentType = '', service = null
	}) {
		return this.methodCallWrapper('setGroupAvatarFromService', rid, cardId, data, contentType, service);
	},
	/**
	 * カード画像を設定する
	 *
	 * setCardAvatarFromServiceと同じように使用してください
	 * @return
	 */
	setCardImageFromService({
		cardId, data, contentType = '', service = null
	}) {
		return this.methodCallWrapper('setCardImageFromService', cardId, data, contentType, service);
	},
	async getAllowCrashReport() {
		const allowCrashReport = await AsyncStorage.getItem(CRASH_REPORT_KEY);
		if (allowCrashReport === null) {
			return true;
		}
		return JSON.parse(allowCrashReport);
	},
	async getAllowAnalyticsEvents() {
		const allowAnalyticsEvents = await AsyncStorage.getItem(ANALYTICS_EVENTS_KEY);
		if (allowAnalyticsEvents === null) {
			return true;
		}
		return JSON.parse(allowAnalyticsEvents);
	},
	async getSortPreferences() {
		const prefs = await UserPreferences.getMapAsync(SORT_PREFS_KEY);
		return prefs;
	},
	async saveSortPreference(param) {
		let prefs = await RocketChat.getSortPreferences();
		prefs = { ...prefs, ...param };
		return UserPreferences.setMapAsync(SORT_PREFS_KEY, prefs);
	},
	async getLoginServices(server) {
		try {
			let loginServices = [];
			const loginServicesResult = await fetch(`${ server }/api/v1/settings.oauth`).then(response => response.json());

			if (loginServicesResult.success && loginServicesResult.services) {
				const { services } = loginServicesResult;
				loginServices = services;

				const loginServicesReducer = loginServices.reduce((ret, item) => {
					const name = item.name || item.buttonLabelText || item.service;
					const authType = this._determineAuthType(item);

					if (authType !== 'not_supported') {
						ret[name] = { ...item, name, authType };
					}

					return ret;
				}, {});
				reduxStore.dispatch(setLoginServices(loginServicesReducer));
			} else {
				reduxStore.dispatch(setLoginServices({}));
			}
		} catch (error) {
			console.log(error);
			reduxStore.dispatch(setLoginServices({}));
		}
	},
	_determineAuthType(services) {
		const {
			name, custom, showButton = true, service
		} = services;

		const authName = name || service;

		if (custom && showButton) {
			return 'oauth_custom';
		}

		if (service === 'saml') {
			return 'saml';
		}

		if (service === 'cas') {
			return 'cas';
		}

		// TODO: remove this after other oauth providers are implemented. e.g. Drupal, github_enterprise
		const availableOAuth = ['apple', 'facebook', 'github', 'gitlab', 'google', 'linkedin', 'meteor-developer', 'twitter', 'wordpress'];
		return availableOAuth.includes(authName) ? 'oauth' : 'not_supported';
	},
	getUsernameSuggestion() {
		// RC 0.65.0
		return this.sdk.get('users.getUsernameSuggestion');
	},
	roomTypeToApiType(t) {
		const types = {
			c: 'channels', d: 'im', p: 'groups', l: 'channels'
		};
		return types[t];
	},
	getFiles(roomId, cardId, type, offset) {
		// RC 0.59.0
		return this.sdk.get(`${ this.roomTypeToApiType(type) }.files`, {
			roomId,
			cardId,
			offset,
			sort: { uploadedAt: -1 },
			fields: {
				name: 1, description: 1, size: 1, type: 1, uploadedAt: 1, url: 1, userId: 1
			}
		});
	},
	getMessages(roomId, cardId, type, query, offset) {
		// RC 0.59.0
		return this.sdk.get(`${ this.roomTypeToApiType(type) }.messages`, {
			roomId,
			cardId,
			query,
			offset,
			sort: { ts: -1 }
		});
	},

	getReadReceipts(messageId, cardId) {
		return this.sdk.get('chat.getMessageReadReceipts', {
			messageId, cardId
		});
	},
	searchMessages(roomId, cardId, searchText) {
		// RC 0.60.0
		return this.sdk.get('chat.search', {
			roomId,
			cardId,
			searchText
		});
	},
	toggleFollowMessage(mid, cardId, follow) {
		// RC 1.0
		if (follow) {
			return this.post('chat.followMessage', { mid, cardId });
		}
		return this.post('chat.unfollowMessage', { mid, cardId });
	},
	getThreadsList({
		rid, cardId, count, offset, text
	}) {
		const params = {
			rid, cardId, count, offset, sort: { ts: -1 }
		};
		if (text) {
			params.text = text;
		}

		// RC 1.0
		return this.sdk.get('chat.getThreadsList', params);
	},
	getSyncThreadsList({ rid, cardId, updatedSince }) {
		// RC 1.0
		return this.sdk.get('chat.syncThreadsList', {
			rid, cardId, updatedSince
		});
	},
	readThreads(tmid, cardId) {
		return this.methodCallWrapper('readThreads', tmid, cardId);
	},
	runSlashCommand(command, roomId, params, triggerId, tmid) {
		// RC 0.60.2
		return this.post('commands.run', {
			command, roomId, params, triggerId, tmid
		});
	},
	getCommandPreview(command, roomId, params) {
		// RC 0.65.0
		return this.sdk.get('commands.preview', {
			command, roomId, params
		});
	},
	executeCommandPreview(command, params, roomId, previewItem, triggerId, tmid) {
		// RC 0.65.0
		return this.post('commands.preview', {
			command, params, roomId, previewItem, triggerId, tmid
		});
	},
	_setUser(ddpMessage) {
		this.activeUsers = this.activeUsers || {};
		const { user } = reduxStore.getState().login;

		if (ddpMessage.fields && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser(ddpMessage.fields));
		}

		if (ddpMessage.cleared && user && user.id === ddpMessage.id) {
			reduxStore.dispatch(setUser({ status: { status: 'offline' } }));
		}

		if (!this._setUserTimer) {
			this._setUserTimer = setTimeout(() => {
				const activeUsersBatch = this.activeUsers;
				InteractionManager.runAfterInteractions(() => {
					reduxStore.dispatch(setActiveUsers(activeUsersBatch));
				});
				this._setUserTimer = null;
				return this.activeUsers = {};
			}, 10000);
		}

		if (!ddpMessage.fields) {
			this.activeUsers[ddpMessage.id] = { status: 'offline' };
		} else if (ddpMessage.fields.status) {
			this.activeUsers[ddpMessage.id] = { status: ddpMessage.fields.status };
		}
	},
	getUsersPresence,
	getUserPresence,
	subscribeUsersPresence,
	getDirectory({
		query, count, offset, sort
	}) {
		// RC 1.0
		return this.sdk.get('directory', {
			query, count, offset, sort
		});
	},
	async canAutoTranslate() {
		const db = database.active;
		try {
			const AutoTranslate_Enabled = reduxStore.getState().settings && reduxStore.getState().settings.AutoTranslate_Enabled;
			if (!AutoTranslate_Enabled) {
				return false;
			}
			const permissionsCollection = db.collections.get('permissions');
			const autoTranslatePermission = await permissionsCollection.find('auto-translate');
			const userRoles = (reduxStore.getState().login.user && reduxStore.getState().login.user.roles) || [];
			return autoTranslatePermission.roles.some(role => userRoles.includes(role));
		} catch (e) {
			log(e, 'canAuthTranslate Error:');
			return false;
		}
	},
	saveAutoTranslate({
		rid, field, value, options
	}) {
		return this.methodCallWrapper('autoTranslate.saveSettings', rid, field, value, options);
	},
	getSupportedLanguagesAutoTranslate() {
		return this.methodCallWrapper('autoTranslate.getSupportedLanguages', 'ja');
	},
	translateMessage(message, targetLanguage) {
		return this.methodCallWrapper('autoTranslate.translateMessage', message, targetLanguage);
	},
	getSenderName(sender) {
		const { UI_Use_Real_Name: useRealName } = reduxStore.getState().settings;
		return useRealName ? sender.name : sender.username;
	},
	getRoomTitle(room) {
		const { UI_Allow_room_names_with_special_chars: allowSpecialChars } = reduxStore.getState().settings;
		const { username } = reduxStore.getState().login.user;
		if (RocketChat.isGroupChat(room) && !(room.name && room.name.length)) {
			return room.usernames.filter(u => u !== username).sort((u1, u2) => u1.localeCompare(u2)).join(', ');
		}
		if (allowSpecialChars && room.t !== 'd') {
			return room.fname || room.name;
		}
		return room.fname;
	},
	getRoomAvatar(room) {
		if (room.t === 'd') {
			return room.rid.replace(room.cardId, '').trim();
		}
		return room.rid;
	},

	findOrCreateInvite({ rid, days, maxUses }) {
		// RC 2.4.0
		return this.post('findOrCreateInvite', { rid, days, maxUses });
	},
	validateInviteToken(token) {
		// RC 2.4.0
		return this.post('validateInviteToken', { token });
	},
	useInviteToken(token) {
		// RC 2.4.0
		return this.post('useInviteToken', { token });
	},
	/**
	 * メール認証
	 * @return bool success 成否
	 * @return string userId ユーザーID
	 * @return string token ログイントークン
	 * @param token
	 */
	emailVerification(token) {
		return this.post('users.emailVerification', { token });
	},
	/**
	 * 利用規約に同意する
	 * @return string userId ユーザーID
	 * @return string token ログイントークン
	 * @param userId
	 * @param token
	 */
	agreement(userId, token) {
		return this.post('users.agreement', { userId, token });
	},
	/**
	 * ユーザーのカード一覧を取得する
	 * @return cards カード情報一覧
	 */
	getUserCards() {
		return this.sdk.get('users.cards', { });
	},
	/**
	 * ユーザーの友達一覧を取得する
	 * @return friends 友達一覧
	 */
	getUserFriends() {
		return this.sdk.get('users.friends', { });
	},
	/**
	 * カード情報を取得する
	 * @return card カード情報
	 * @param cardId
	 */
	getCardInfo(cardId) {
		return this.sdk.get('cards.info', { cardId });
	},

	/**
	 * カード情報を取得する
	 * @return card カード情報
	 * @param cId
	 */
	getCardDetail(cId) {
		return this.sdk.get('cards.detail', { cId });
	},
	/**
	 * カードを作成する
	 *
	 *                   String userId ユーザーID（オプション ユーザーIDが指定されている場合は指定されたユーザーIDのカードを作成）
	 *                   String name カード名
	 *                   String username ユーザー名
	 *                   String comment コメント（オプション）
	 *                   Object scene シーン（オプション）
	 *                       {
	 *                           String code: // シーンコード
	 *                           String name: // シーン名（自由入力）
	 *                       }
	 *                   Boolean secret シークレットフラグ（オプション）
	 *                   Array blocks ブロックカードID（オプション）
	 *                   Array profiles プロフィール情報（オプション）
	 *                       [
	 *                           {
	 *                                name: String, // プロフィール名
	 * 	                              type: String, // 種別
	 * 	                              value: mixed, // 値
	 * 	                              public: Boolean, // 公開状態（オプション）
	 * 	                              order: Number, // 表示順（オプション）
	 * 	                              freeItem: Boolean, // 自由項目（オプション）
	 *                           },
	 *                       ]
	 *                   Number order 表示順（オプション）
	 *                   Boolean active 選択フラグ（オプション）
	 * }
	 * @return {
	 *     card 作成したカード情報
	 *     cards カード情報一覧
	 * }
	 * @param params
	 */
	createCard(params) {
		return this.post('cards.create', params);
	},
	/**
	 * カードを更新する
	 * プロフィール情報については、設定されている値をすべて削除し、指定した配列で置き換える
	 *
	 *                   String cardId カードID
	 *                   String name カード名（オプション）
	 *                   String username ユーザー名（オプション）
	 *                   String comment コメント（オプション）
	 *                   Object scene シーン（オプション）
	 *                       {
	 *                           String code: // シーンコード
	 *                           String name: // シーン名（自由入力）
	 *                       }
	 *                   Boolean secret シークレットフラグ（オプション）
	 *                   Array blocks ブロックカードID（オプション）
	 *                   Array profiles プロフィール情報（オプション）
	 *                       [
	 *                           {
	 *                                name: String, // プロフィール名
	 * 	                              type: String, // 種別
	 * 	                              value: mixed, // 値
	 * 	                              public: Boolean, // 公開状態（オプション）
	 * 	                              order: Number, // 表示順（オプション）
	 * 	                              freeItem: Boolean, // 自由項目（オプション）
	 *                           },
	 *                       ]
	 *                   Number order 表示順（オプション）
	 *                   Boolean active 選択フラグ（オプション）
	 * }
	 * @return {
	 *     card 更新したカード情報
	 *     cards カード情報一覧
	 * }
	 * @param params
	 */
	updateCard(params) {
		return this.post('cards.update', params);
	},
	/**
	 * カードを削除する
	 *
	 * @return cards カード情報一覧
	 * @param userId
	 * @param cardId
	 */
	deleteCard(userId, cardId) {
		return this.post('cards.delete', { cardId });
	},
	/**
	 * カードプロフィール情報を置き換える
	 * 設定されている値をすべて削除し、指定した配列で置き換える
	 *
	 *                   String cardId カードID
	 *                   Array profiles プロフィール情報（オプション）
	 *                       [
	 *                           {
	 *                                name: String, // プロフィール名
	 * 	                              type: String, // 種別
	 * 	                              value: mixed, // 値
	 * 	                              public: Boolean, // 公開状態（オプション）
	 * 	                              order: Number, // 表示順（オプション）
	 * 	                              freeItem: Boolean, // 自由項目（オプション）
	 *                           },
	 *                       ]
	 * }
	 * @return profiles カードプロフィール情報一覧
	 * @param params
	 */
	replaceCardProfile(params) {
		return this.post('cards.profiles.replace', params);
	},

	/**
	 *
	 * @param cards
	 * @returns {Promise<unknown>}
	 */
	fetchCards(cards, userId) {
		// カード情報をリストア
		return new Promise(async(resolve) => {
			try {
				// カード情報をリストア
				if (cards && cards.length) {
					InteractionManager.runAfterInteractions(async() => {
						const db = database.active;
						const cardCollection = db.collections.get('cards');

						let allCardRecords = await cardCollection.query().fetch();
						allCardRecords = allCardRecords.filter(c => c.userId && c.userId === userId);

						// filter cards
						let cardsToCreate = cards.filter(i1 => !allCardRecords.find(i2 => i1._id === i2.id));
						let cardsToUpdate = allCardRecords.filter(i1 => cards.find(i2 => i1.id === i2._id));
						let cardsToRemove = allCardRecords.filter(i1 => !cards.find(i2 => i1.id === i2._id));
						// Create
						cardsToCreate = cardsToCreate.map(card => cardCollection.prepareCreate((e) => {
							e._raw = sanitizedRaw({ id: card._id }, cardCollection.schema);
							Object.assign(e, card);
						}));

						// Update
						cardsToUpdate = cardsToUpdate.map((card) => {
							const newCard = cards.find(e => e._id === card.id);
							return card.prepareUpdate(protectedFunction((e) => {
								Object.assign(e, newCard);
							}));
						});

						cardsToRemove = cardsToRemove.map(card => card.prepareDestroyPermanently());

						try {
							await db.action(async() => {
								await db.batch(
									...cardsToCreate,
									...cardsToUpdate,
									...cardsToRemove
								);
							});
						} catch (e) {
						}
					});
					return resolve();
				}
			} catch (e) {
				log(e, 'Fetch Cards Error: ');
				return resolve();
			}
		});
	},

	/**
	 *
	 */
	async setCards(userId) {
		if (!userId) {
			return;
		}

		try {
			const db = database.active;
			const cardCollection = db.collections.get('cards');

			const cardRecords = await cardCollection.query().fetch();
			const cards = Object.values(cardRecords)
				.filter(card => card.userId === userId)
				.map(card => ({
					_id: card.id,
					cId: card.cId,
					active: card.active,
					name: card.name,
					avatarOrigin: card.avatarOrigin,
					blocks: card.blocks,
					order: card.order,
					scene: card.scene,
					userId: card.userId,
					username: card.username,
					isSecret: card.isSecret,
					back_color: card.back_color,
					text_color: card.text_color,
					avatarETag: card.avatarETag
				}));
			reduxStore.dispatch(setCardsAction(cards));
		} catch (e) {
			log(e, 'Set Cards Error:');
		}
	},

	/**
	 * カードを1件選択する（1件のみ）
	 *
	 * @return {
	 *     card 選択したカード情報
	 *     cards カード情報一覧
	 * }
	 * @param cardId
	 */
	selectOneCard(cardId) {
		const sdk = this.sdk || this.shareSDK;
		return sdk.post('cards.selectOne', { cardId });
	},

	/**
	 *
	 * @param cardId
	 * @param password
	 * @returns {Promise<any>}
	 */
	openSecretCard(cardId, password) {
		const sdk = this.sdk || this.shareSDK;
		return sdk.post('cards.openSecret', { cardId, password });
	},
	/**
	 * カードを複数選択する（選択しているすべて）
	 *
	 * @return cards カード情報一覧
	 * @param cardIds
	 */
	selectsCard(cardIds) {
		return this.post('cards.selects', { cardIds });
	},
	/**
	 * カードの全選択状態を設定する
	 *
	 * @params selectAll カードの全選択状態
	 * @return cards カード情報一覧
	 */
	selectAllCard(selectAll) {
		const sdk = this.sdk || this.shareSDK;
		return sdk.post('cards.selectAll', { selectAll });
	},
	/**
	 * カード画像を設定する
	 * @param cardId
	 * @param userId
	 * @param iconUrl
	 */
	setCardImage(cardId, userId, iconUrl) {
		return this.post('cards.setImage', { cardId, userId, iconUrl });
	},
	/**
	 * カード画像を取得する
	 * @return カード画像URL
	 * @param cardId
	 */
	getCardImage(cardId) {
		return this.sdk.get('cards.getImage', { cardId });
	},
	/**
	 * カード画像をリセットする
	 * @param cardId
	 * @param userId
	 */
	resetCardImage(cardId, userId) {
		return this.post('cards.resetImage', { cardId, userId });
	},
	/**
	 * カードのアバターを設定する
	 * @param cardId
	 * @param userId
	 * @param avatarUrl
	 */
	setCardAvatar(cardId, userId, avatarUrl) {
		return this.post('cards.setAvatar', { cardId, userId, avatarUrl });
	},
	/**
	 * カードのアバター画像を取得する
	 * @return アバター画像URL
	 * @param cardId
	 */
	getCardAvatar(cardId) {
		return this.sdk.get('cards.getAvatar', { cardId });
	},
	/**
	 * カードのアバター画像をリセットする
	 * @param cardId
	 * @param userId
	 */
	resetCardAvatar(cardId, userId) {
		return this.post('cards.resetAvatar', { cardId, userId });
	},
	/**
	 * カードの友達一覧を取得する
	 * @return friends 友達一覧
	 * @param cardId
	 */
	getCardFriends(cardId) {
		return this.sdk.get('cards.friends', { cardId });
	},
	/**
	 * カードの友達一覧を取得する
	 * @return friends 友達一覧
	 * @param userId
	 */
	async getCardFriendAll(userId) {
		const db = database.active;
		return new Promise(async(resolve) => {
			try {
				if (!userId) {
					return resolve();
				}
				const result = await this.sdk.get('cards.friendAll');

				if (!result.success) {
					return resolve();
				}

				const { cards } = result;

				if (cards && cards.length) {
					InteractionManager.runAfterInteractions(async() => {
						const cardCollection = db.collections.get('cards');

						let allCardRecords = await cardCollection.query().fetch();
						allCardRecords = allCardRecords.filter(c => c.userId && c.userId !== userId);

						// filter cards
						let cardsToCreate = cards.filter(i1 => !allCardRecords.find(i2 => i1._id === i2.id));
						let cardsToUpdate = allCardRecords.filter(i1 => cards.find(i2 => i1.id === i2._id));
						let cardsToRemove = allCardRecords.filter(i1 => !cards.find(i2 => i1.id === i2._id));
						// Create
						cardsToCreate = cardsToCreate.map(card => cardCollection.prepareCreate((e) => {
							e._raw = sanitizedRaw({ id: card._id }, cardCollection.schema);
							Object.assign(e, card);
						}));

						// Update
						cardsToUpdate = cardsToUpdate.map((card) => {
							const newCard = cards.find(e => e._id === card.id);
							return card.prepareUpdate(protectedFunction((e) => {
								Object.assign(e, newCard);
							}));
						});

						cardsToRemove = cardsToRemove.map(card => card.prepareDestroyPermanently());

						const allRecords = [
							...cardsToCreate,
							...cardsToUpdate,
							...cardsToRemove
						];
						try {
							await db.action(async() => {
								await db.batch(
									...allRecords
								);
							});
						} catch (e) {
						}
						return allRecords.length;
					});
				}
			} catch (e) {
				log(e, 'getCardFriendAll Error:');
				return resolve();
			}
		});
	},
	/**
	 * カードの表示順を設定する
	 * @return cards カード情報一覧
	 * @param cards
	 */
	setCardOrders(cards) {
		return this.post('cards.setOrders', { cards });
	},
	/**
	 * シーン情報を取得する
	 * @return scene シーン情報
	 * @param sceneId
	 */
	getSceneInfo(sceneId) {
		return this.sdk.get('scenes.info', { sceneId });
	},
	/**
	 * シーン情報を取得する
	 * @return {
	 *     scenes シーン情報一覧
	 *     profileTypes プロフィールタイプ一覧
	 * }
	 */
	getSceneList() {
		return this.sdk.get('scenes.list');
	},
	/**
	 * 友達かどうかを取得する
	 *
	 * @return Boolean isFriend 友達かどうか
	 * @param cardId
	 * @param friendCardId
	 */
	isFriend(cardId, friendCardId) {
		return this.post('friends.is', { cardId, friendCardId });
	},
	/**
	 * 友達情報を取得する
	 * カードIDと友達IDまたは友達のカードIDを指定する
	 *
	 * @return friend 友達情報
	 * @param cardId
	 * @param friendId
	 * @param friendCardId
	 */
	getFriendInfo(cardId, friendId = null, friendCardId = null) {
		return this.post('friends.info', { cardId, friendId, friendCardId });
	},
	/**
	 * 友達一覧を取得する
	 *
	 * カードの全選択状態を判断し、
	 * 全ての友達一覧または選択しているカードの友達一覧を返す
	 *
	 * @return friends 友達一覧
	 */
	getFriends() {
		return this.sdk.get('friends.list');
	},
	/**
	 * 友達情報を作成する
	 *
	 *                   String cardId カードID
	 *                   String friendCardId 友達のカードID
	 *                   String memo メモ（オプション）
	 *                   Boolean talk トークフラグ（オプション）
	 *                   Boolean call 通話フラグ（オプション）
	 *                   Boolean video ビデオ通話フラグ（オプション）
	 *                   Boolean block ブロックフラグ（オプション）
	 * }
	 * @return {
	 *     friend 作成した友達情報
	 *     friends 友達情報一覧
	 * }
	 * @param params
	 */
	createFriend(params) {
		return this.post('friends.create', params);
	},
	/**
	 * 友達情報を更新する
	 *
	 *                   String friendId 友達ID
	 *                   String memo メモ（オプション）
	 *                   Boolean talk トークフラグ（オプション）
	 *                   Boolean call 通話フラグ（オプション）
	 *                   Boolean video ビデオ通話フラグ（オプション）
	 *                   Boolean block ブロックフラグ（オプション）
	 * }
	 * @return {
	 *     friend 更新した友達情報
	 *     friends 友達情報一覧
	 * }
	 * @param params
	 */
	updateFriend(params) {
		return this.post('friends.update', params);
	},
	/**
	 * 友達を削除する
	 * 友達IDまたはカードID、友達のカードIDを指定する
	 *
	 * @return friends 友達情報一覧
	 * @param friendId
	 * @param cardId
	 * @param friendCardId
	 */
	deleteFriend(friendId, cardId, friendCardId) {
		return this.post('friends.delete', { friendId, cardId, friendCardId });
	},
	/**
	 * 友達のブロック設定を行う
	 *
	 * @param cardId
	 * @param friendId
	 * @param block
	 */
	blockFriend(cardId, friendId, block) {
		return this.post('friends.block', { cardId, friendId, block });
	},
	/**
	 * 複数の友達のブロック設定を行う
	 *
	 *                  [
	 *                      {
	 *                          String friendId 友達ID
	 *                          Boolean block ブロックフラグ
	 *                      }
	 *                  ]
	 * @return friends 友達情報一覧
	 * @param cardId
	 * @param friends
	 */
	blockFriends(cardId, friends) {
		return this.post('friends.blocks', { cardId, friends });
	},
	/**
	 * 複数の友達の機能制限設定を行う
	 *
	 *                  [
	 *                      {
	 *                          String friendId 友達ID
	 *                          Boolean talk トークフラグ（オプション）
	 *                          Boolean call 通話フラグ（オプション）
	 *                          Boolean video ビデオ通話フラグ（オプション）
	 *                          Boolean block ブロックフラグ（オプション）
	 *                      },
	 *                  ]
	 * @return friends 友達情報一覧
	 * @param cardId
	 * @param friends
	 */
	setFriendPermissions(cardId, friends) {
		return this.post('friends.setPermissions', { cardId, friends });
	},
	/**
	 * グループに招待する
	 *
	 * @return group グループ情報
	 * @param roomId
	 * @param inviterId
	 * @param cardId
	 */
	inviteGroup(roomId, inviterId, cardId) {
		return this.post('groups.invite', { roomId, inviterId, cardId });
	},
	/**
	 * グループから退出させる
	 *
	 * @return group グループ情報
	 * @param roomId
	 * @param operatorId
	 * @param cardId
	 */
	kickGroup(roomId, operatorId, cardId) {
		return this.post('groups.kick', { roomId, operatorId, cardId });
	},
	/**
	 *
	 * @param email
	 * @returns {Promise<any>}
	 */
	inviteWithMail(email) {
		return this.post('inviteWithMail', { email });
	},

	downloadEmoji(emoji_id, is_gift = false) {
		return this.post('users.addEmoji', { id: emoji_id, is_gift });
	},
	removeEmojiFromUser(emoji_id) {
		return this.post('users.removeEmoji', { id: emoji_id });
	},
	giftEmojiToOther(emoji_id, chats, gift_name) {
		return this.post('users.giftEmoji', { id: emoji_id, chats, name: gift_name });
	},
	deleteAttachment(messageId, cardId, fileLink) {
		return this.post('chat.deleteAttachment', { messageId, cardId, fileLink });
	}
};

export default RocketChat;

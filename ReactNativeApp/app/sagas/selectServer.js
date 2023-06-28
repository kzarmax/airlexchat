import { put, takeLatest } from 'redux-saga/effects';
import { Alert } from 'react-native';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import { Q } from '@nozbe/watermelondb';
import semver from 'semver';

import Navigation from '../lib/Navigation';
import { SERVER } from '../actions/actionsTypes';
import {
	serverFailure, selectServerRequest, selectServerSuccess, selectServerFailure
} from '../actions/server';
import { clearSettings } from '../actions/settings';
import { setUser } from '../actions/login';
import RocketChat from '../lib/rocketchat';
import database from '../lib/database';
import log from '../utils/log';
import I18n from '../i18n';
import { BASIC_AUTH_KEY, setBasicAuth } from '../utils/fetch';
import {appStart, ROOT_AGREEMENT, ROOT_FIRST_CARD, ROOT_INSIDE, ROOT_OUTSIDE} from '../actions/app';
import UserPreferences from '../lib/userPreferences';
import { encryptionStop } from '../actions/encryption';
import SSLPinning from '../utils/sslPinning';

import { inquiryReset } from '../ee/omnichannel/actions/inquiry';
import {DEFAULT_SERVER} from "../constants/servers";

const getServerInfo = function* getServerInfo({ server, raiseError = true }) {
	try {
		const serverInfo = yield RocketChat.getServerInfo(server);
		let websocketInfo = { success: true };
		if (raiseError) {
			websocketInfo = yield RocketChat.getWebsocketInfo({ server });
		}
		if (!serverInfo.success || !websocketInfo.success) {
			if (raiseError) {
				const info = serverInfo.success ? websocketInfo : serverInfo;
				Alert.alert(I18n.t('Oops'), info.message);
			}
			yield put(serverFailure());
			return;
		}

		let serverVersion = semver.valid(serverInfo.version);
		if (!serverVersion) {
			({ version: serverVersion } = semver.coerce(serverInfo.version));
		}

		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		yield serversDB.action(async() => {
			try {
				const serverRecord = await serversCollection.find(server);
				await serverRecord.update((record) => {
					record.version = serverVersion;
				});
			} catch (e) {
				await serversCollection.create((record) => {
					record._raw = sanitizedRaw({ id: server }, serversCollection.schema);
					record.version = serverVersion;
				});
			}
		});

		return serverInfo;
	} catch (e) {
		log(e, 'Get ServerInfo Error:');
	}
};

const handleSelectServer = function* handleSelectServer({ server }) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = yield UserPreferences.getStringAsync(`${ RocketChat.CERTIFICATE_KEY }-${ DEFAULT_SERVER }`);
		yield SSLPinning.setCertificate(certificate, server);

		yield put(inquiryReset());
		yield put(encryptionStop());
		const serversDB = database.servers;

		const userId = yield UserPreferences.getStringAsyncWithOldVersion(`${ RocketChat.TOKEN_KEY }-${ DEFAULT_SERVER }`);
		const userCollections = serversDB.collections.get('users');
		let user = null;
		if (userId) {
			// version < 1.2.0
			if(userId.length > 17){
				user = JSON.parse(userId);
			} else {
				try {
					// search credentials on database
					const userRecord = yield userCollections.find(userId);
					user = {
						id: userRecord.id,
						token: userRecord.token,
						username: userRecord.username,
						name: userRecord.name,
						language: userRecord.language,
						status: userRecord.status,
						statusText: userRecord.statusText,
						roles: userRecord.roles,
						agree: userRecord.agree,
						emojis: userRecord.emojis,
						cardCreated: userRecord.cardCreated,
						avatarETag: userRecord.avatarETag,
						server: userRecord.server
					};
				} catch {
					// search credentials on shared credentials
					const token = yield UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ userId }`);
					if (token) {
						user = { token };
					}
				}
			}
		}

		const basicAuth = yield UserPreferences.getStringAsync(`${ BASIC_AUTH_KEY }-${ server }`);
		setBasicAuth(basicAuth);

		// Check for running requests and abort them before connecting to the server
		RocketChat.abort();

		if (user) {
			yield put(clearSettings());
			yield RocketChat.connect({ server, user, logoutOnError: true });
			yield put(setUser(user));
			if (!user.agree) {
				yield put(appStart({root:ROOT_AGREEMENT}));
			} else if (!user.cardCreated) {
				yield put(appStart({root: ROOT_FIRST_CARD}));
			} else {
				yield put(appStart({ root: ROOT_INSIDE }));
			}
		} else {
			yield RocketChat.connect({ server });
			yield put(appStart({ root: ROOT_OUTSIDE }));
		}

		// We can't use yield here because fetch of Settings & Custom Emojis is slower
		// and block the selectServerSuccess raising multiples errors
		RocketChat.setSettings();
		RocketChat.setCustomEmojis();
		RocketChat.setEnterpriseModules();
		RocketChat.setPointProfiles();
		RocketChat.setCards(user?.id);

		// we'll set serverVersion as metadata for bugsnag
		yield put(selectServerSuccess(server));
	} catch (e) {
		yield put(selectServerFailure());
		log(e, 'Select Server Error: ');
	}
};

const handleServerRequest = function* handleServerRequest({ server }) {
	try {
		// SSL Pinning - Read certificate alias and set it to be used by network requests
		const certificate = yield UserPreferences.getStringAsync(`${ RocketChat.CERTIFICATE_KEY }-${ server }`);
		yield SSLPinning.setCertificate(certificate, server);

		const serverInfo = yield getServerInfo({ server });

		if (serverInfo) {
			yield RocketChat.getLoginServices(server);
			yield RocketChat.getLoginSettings({ server });

			yield put(selectServerRequest(server, serverInfo.version, false));
		}
	} catch (e) {
		yield put(serverFailure());
		log(e, 'Server Request Error:');
	}
};

const root = function* root() {
	yield takeLatest(SERVER.REQUEST, handleServerRequest);
	yield takeLatest(SERVER.SELECT_REQUEST, handleSelectServer);
};
export default root;

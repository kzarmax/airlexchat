import EJSON from 'ejson';
import { takeLatest, select, put } from 'redux-saga/effects';

import { ENCRYPTION } from '../actions/actionsTypes';
import {encryptionDecodeKey, encryptionSet} from '../actions/encryption';
import { Encryption } from '../lib/encryption';
import Navigation from '../lib/Navigation';
import {
	E2E_PUBLIC_KEY,
	E2E_PRIVATE_KEY,
	E2E_BANNER_TYPE,
	E2E_RANDOM_PASSWORD_KEY
} from '../lib/encryption/constants';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';
import UserPreferences from '../lib/userPreferences';
import { getUserSelector } from '../selectors/login';
import { showErrorAlert } from '../utils/info';
import I18n from '../i18n';
import log from '../utils/log';
import {AIRLEX_DEFAULT_PASSWORD} from "../lib/encryption/utils";

const getServer = state => state.share.server.server || state.server.server;
const getE2eEnable = state => state.settings.E2E_Enable;

const handleEncryptionInit = function* handleEncryptionInit() {
	try {
		const server = yield select(getServer);
		const user = yield select(getUserSelector);
		const E2E_Enable = yield select(getE2eEnable);

		// Fetch server info to check E2E enable
		const serversDB = database.servers;
		const serversCollection = serversDB.collections.get('servers');
		let serverInfo;
		try {
			serverInfo = yield serversCollection.find(server);
		} catch {
			// Server not found
		}

		// If E2E is disabled on server, skip
		if (!serverInfo?.E2E_Enable && !E2E_Enable) {
			return;
		}

		// TODO Change Encryption Password Disable
		// Fetch stored private e2e key for this server
		const storedPrivateKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PRIVATE_KEY }`);

		// Fetch server stored e2e keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		let storedPublicKey = yield UserPreferences.getStringAsync(`${ server }-${ E2E_PUBLIC_KEY }`);
		// Prevent parse undefined
		if (storedPublicKey) {
			storedPublicKey = EJSON.parse(storedPublicKey);
		}

		if ((keys?.privateKey && keys?.publicKey)) {
			// Persist these keys
			if(storedPrivateKey && storedPublicKey){
				yield Encryption.persistKeys(server, storedPublicKey, storedPrivateKey);
				yield put(encryptionSet(true));
			} else {
				yield put(encryptionDecodeKey(AIRLEX_DEFAULT_PASSWORD));
				return;
			}
		} else {
			// Create new keys since the user doesn't have any
			yield Encryption.createKeys(user.id, server);
		}
		// Decrypt all pending messages/subscriptions
		Encryption.initialize(user.id);
	} catch (e) {
		log(e, 'Encryption Init');
	}
};

const handleEncryptionStop = function* handleEncryptionStop() {
	// Hide encryption banner
	yield put(encryptionSet());
	// Stop Encryption client
	Encryption.stop();
};

const handleEncryptionDecodeKey = function* handleEncryptionDecodeKey({ password }) {
	try {
		const server = yield select(getServer);
		const user = yield select(getUserSelector);

		// Fetch server stored e2e keys
		const keys = yield RocketChat.e2eFetchMyKeys();

		const publicKey = EJSON.parse(keys?.publicKey);

		// Decode the current server key
		const privateKey = yield Encryption.decodePrivateKey(keys?.privateKey, password, user.id);
		// Persist these decrypted keys
		yield Encryption.persistKeys(server, publicKey, privateKey);

		yield put(encryptionSet(true));

		Encryption.initialize(user.id);
	} catch {
		// Can't decrypt user private key
		showErrorAlert(I18n.t('Encryption_error_title'), I18n.t('Oops'));
	}
};

const root = function* root() {
	yield takeLatest(ENCRYPTION.INIT, handleEncryptionInit);
	yield takeLatest(ENCRYPTION.STOP, handleEncryptionStop);
	yield takeLatest(ENCRYPTION.DECODE_KEY, handleEncryptionDecodeKey);
};
export default root;

import { call, cancel, delay, fork, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';
import moment from 'moment';
import 'moment/min/locales';
import { I18nManager } from 'react-native';

import * as types from '../actions/actionsTypes';
import { appStart, ROOT_AGREEMENT, ROOT_FIRST_CARD, ROOT_INSIDE, ROOT_LOADING, ROOT_OUTSIDE } from '../actions/app';
import { serverRequest } from '../actions/server';
import { loginFailure, loginSuccess, logout, setUser } from '../actions/login';
import { roomsRequest } from '../actions/rooms';
import { toMomentLocale } from '../utils/moment';
import RocketChat from '../lib/rocketchat';
import log, {events, logEvent} from '../utils/log';
import I18n, {isRTL, LANGUAGES} from '../i18n';
import database from '../lib/database';
import EventEmitter from '../utils/events';
import { inviteLinksRequest } from '../actions/inviteLinks';
import { showErrorAlert } from '../utils/info';
import { setActiveUsers } from '../actions/activeUsers';
import { encryptionInit, encryptionStop } from '../actions/encryption';
import UserPreferences from '../lib/userPreferences';

import { inquiryRequest, inquiryReset } from '../ee/omnichannel/actions/inquiry';
import { isOmnichannelStatusAvailable } from '../ee/omnichannel/lib';
import Navigation from '../lib/Navigation';
import { getReadableVersion } from "../utils/deviceInfo";
import { CARD_SELECT_ALL } from "../constants/storage";
import { cardsRequest } from "../actions/cards";
import { DEFAULT_SERVER } from "../constants/servers";
import {E2E_REFRESH_MESSAGES_KEY} from "../lib/encryption/constants";

const getServer = state => state.server.server;
const loginWithPasswordCall = ({credentials}) => RocketChat.loginWithPassword(credentials);
const loginCall = ({credentials}) => RocketChat.login(credentials);
const logoutCall = () => RocketChat.logout({ server: DEFAULT_SERVER});
const setDeviceInfo = ({deviceInfo}) => RocketChat.setDeviceInfo(deviceInfo);
const getCards = () => RocketChat.getUserCards();

const handleLoginRequest = function* handleLoginRequest({ credentials, logoutOnError = false }) {
	logEvent(events.LOGIN_DEFAULT_LOGIN);
	try {
		let result;
		if (credentials.resume) {
			result = yield call(loginCall, {credentials});
		} else {
			result = yield call(loginWithPasswordCall, {credentials});
		}

		if(!result.deviceInfo || result.deviceInfo !== getReadableVersion){
			yield call(setDeviceInfo,  { deviceInfo:getReadableVersion });
		}

		// Preload User`s Cards
		const { cards } = yield call(getCards);

		yield put(loginSuccess({user: result, cards}));
	} catch (e) {
		if (logoutOnError && (e.data && e.data.message && /you've been logged out by the server/i.test(e.data.message))) {
			yield put(logout(true));
		} else {
			logEvent(events.LOGIN_DEFAULT_LOGIN_F);
			yield put(loginFailure(e));
		}
	}
};

const fetchPermissions = function* fetchPermissions() {
	yield RocketChat.getPermissions();
};

const fetchCustomEmojis = function* fetchCustomEmojis() {
	yield RocketChat.getCustomEmojis();
};

const fetchPointProfiles = function* fetchPointProfiles() {
	yield RocketChat.getPointProfiles();
};

const fetchRoles = function* fetchRoles() {
	yield RocketChat.getRoles();
};

const fetchSlashCommands = function* fetchSlashCommands() {
	yield RocketChat.getSlashCommands();
};

const registerPushToken = function* registerPushToken() {
	yield RocketChat.registerPushToken();
};

const fetchUsersPresence = function* fetchUserPresence() {
	yield RocketChat.getUsersPresence();
	RocketChat.subscribeUsersPresence();
};

const fetchEnterpriseModules = function* fetchEnterpriseModules({ user }) {
	yield RocketChat.getEnterpriseModules();

	if (isOmnichannelStatusAvailable(user) && RocketChat.isOmnichannelModuleAvailable()) {
		yield put(inquiryRequest());
	}
};

const fetchRooms = function* fetchRooms({ server }) {
	try {
		// Read the flag to check if refresh was already done
		const refreshed = yield UserPreferences.getBoolAsync(E2E_REFRESH_MESSAGES_KEY);
		if (!refreshed) {
			const serversDB = database.servers;
			const serversCollection = serversDB.collections.get('servers');

			const serverRecord = yield serversCollection.find(server);

			// We need to reset roomsUpdatedAt to request all rooms again
			// and save their respective E2EKeys to decrypt all pending messages and lastMessage
			// that are already inserted on local database by other app version
			yield serversDB.action(async() => {
				await serverRecord.update((s) => {
					s.roomsUpdatedAt = null;
				});
			});

			// Set the flag to indicate that already refreshed
			yield UserPreferences.setBoolAsync(E2E_REFRESH_MESSAGES_KEY, true);
		}
	} catch (e) {
		log(e, 'Fetch Rooms Error: ');
	}
	yield put(roomsRequest());
};

const fetchCards = function* fetchCards({cards, userId}) {
	yield RocketChat.fetchCards(cards, userId);
}

const fetchFriendCards = function* fetchFriendCards({userId}){
	yield RocketChat.getCardFriendAll(userId);
}

const handleLoginSuccess = function* handleLoginSuccess({ data }) {
	try {
		const { user, cards } = data;
		yield UserPreferences.setStringAsync(RocketChat.TOKEN_KEY, user.token);

		RocketChat.getUserPresence(user.id);

		// version < 1.2.0  SelectAll => '1'/'0'
		const selectAllString = yield UserPreferences.getStringAsync(CARD_SELECT_ALL);
		let selectAll = yield UserPreferences.getBoolAsync(CARD_SELECT_ALL);
		if(selectAllString){
			selectAll = Number(selectAllString);
		}
		yield put(cardsRequest({ selectAll: !!(selectAll), cards }));

		const server = yield select(getServer);
		yield fork(fetchRooms, { server });
		yield fork(fetchPermissions);
		yield fork(fetchCustomEmojis);
		yield fork(fetchPointProfiles);
		yield fork(fetchRoles);
		yield fork(fetchSlashCommands);
		yield fork(registerPushToken);
		yield fork(fetchUsersPresence);
		yield fork(fetchEnterpriseModules, { user });
		yield put(encryptionInit());
		yield fork(fetchCards, { cards, userId: user.id });
		yield fork(fetchFriendCards, { userId: user.id });

		moment.locale(toMomentLocale('ja'));

		const serversDB = database.servers;
		const usersCollection = serversDB.collections.get('users');
		const u = {
			token: user.token,
			username: user.username,
			name: user.name,
			language: user.language??'ja',
			status: user.status,
			statusText: user.statusText,
			roles: user.roles,
			agree: user.agree,
			emojis: user.emojis,
			cardCreated: user.cardCreated,
			points: user.points,
			loginEmailPassword: user.loginEmailPassword,
			showMessageInMainThread: user.showMessageInMainThread,
			avatarETag: user.avatarETag,
			serverUrl: user.serverUrl
		};

		yield serversDB.action(async() => {
			try {
				const userRecord = await usersCollection.find(user.id);
				u.loginEmailPassword = userRecord?.loginEmailPassword;
				await userRecord.update((record) => {
					record._raw = sanitizedRaw({ id: user.id, ...record._raw }, usersCollection.schema);
					Object.assign(record, u);
				});
			} catch (e) {
				await usersCollection.create((record) => {
					record._raw = sanitizedRaw({ id: user.id }, usersCollection.schema);
					Object.assign(record, u);
				});
			}
		});

		yield UserPreferences.setStringAsync(RocketChat.CURRENT_SERVER, user.serverUrl);
		yield UserPreferences.setStringAsync(`${ RocketChat.TOKEN_KEY }-${ DEFAULT_SERVER }`, user.id);
		yield UserPreferences.setStringAsync(`${ RocketChat.TOKEN_KEY }-${ user.id }`, user.token);
		yield put(setUser(user));
		EventEmitter.emit('connected');

		let currentRoot;
		if (!user.agree) {
			yield put(appStart({root:ROOT_AGREEMENT}));
		} else if (!user.cardCreated) {
			yield put(appStart({root: ROOT_FIRST_CARD}));
		} else {
			currentRoot = yield select(state => state.app.root);
			if (currentRoot !== ROOT_INSIDE) {
				yield put(appStart({ root: ROOT_INSIDE }));
			}
		}

		// after a successful login, check if it's been invited via invite link
		currentRoot = yield select(state => state.app.root);
		if (currentRoot === ROOT_INSIDE) {
			const inviteLinkToken = yield select(state => state.inviteLinks.token);
			if (inviteLinkToken) {
				yield put(inviteLinksRequest(inviteLinkToken));
			}
		}
	} catch (e) {
		log(e);
	}
};

const handleLogout = function* handleLogout({ forcedByServer }) {
	yield put(encryptionStop());
	yield put(appStart({ root: ROOT_LOADING, text: I18n.t('Logging_out') }));
	try {
		yield call(logoutCall);

		// if the user was logged out by the server
		if (forcedByServer) {
			yield put(appStart({ root: ROOT_OUTSIDE }));
			showErrorAlert(I18n.t('Logged_out_by_server'), I18n.t('Oops'));
			yield delay(300);
			Navigation.navigate('SigninView');
			yield delay(300);
			yield put(serverRequest(DEFAULT_SERVER));
		} else {

			yield put(serverRequest(DEFAULT_SERVER));
			// if there's no servers, go outside
			yield put(appStart({ root: ROOT_OUTSIDE }));
		}
	} catch (e) {
		yield put(appStart({ root: ROOT_OUTSIDE }));
		log(e);
	}
};

const handleSetUser = function* handleSetUser({ user }) {
	if (user && user.language) {
		const locale = LANGUAGES.find(l => l.value.toLowerCase() === user.language)?.value || user.language;
		I18n.locale = locale;
		I18nManager.forceRTL(isRTL(locale));
		I18nManager.swapLeftAndRightInRTL(isRTL(locale));
		moment.locale(toMomentLocale(locale));
	}

	if (user && user.status) {
		const userId = yield select(state => state.login.user.id);
		yield put(setActiveUsers({ [userId]: user }));
	}

	if (user?.statusLivechat && RocketChat.isOmnichannelModuleAvailable()) {
		if (isOmnichannelStatusAvailable(user)) {
			yield put(inquiryRequest());
		} else {
			yield put(inquiryReset());
		}
	}
};

const root = function* root() {
	yield takeLatest(types.LOGIN.REQUEST, handleLoginRequest);
	yield takeLatest(types.LOGOUT, handleLogout);
	yield takeLatest(types.USER.SET, handleSetUser);

	while (true) {
		const params = yield take(types.LOGIN.SUCCESS);
		const loginSuccessTask = yield fork(handleLoginSuccess, params);
		yield race({
			selectRequest: take(types.SERVER.SELECT_REQUEST),
			timeout: delay(2000)
		});
		yield cancel(loginSuccessTask);
	}
};
export default root;

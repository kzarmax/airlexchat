import { put, takeLatest, all } from 'redux-saga/effects';
import RNBootSplash from 'react-native-bootsplash';

import UserPreferences from '../lib/userPreferences';
import {selectServerRequest, serverRequest} from '../actions/server';
import { setAllPreferences } from '../actions/sortPreferences';
import { toggleCrashReport, toggleAnalyticsEvents } from '../actions/crashReport';
import { APP } from '../actions/actionsTypes';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import { appStart, ROOT_OUTSIDE, appReady } from '../actions/app';
import {DEFAULT_SERVER} from '../constants/servers';

export const initLocalSettings = function* initLocalSettings() {
	const sortPreferences = yield RocketChat.getSortPreferences();
	yield put(setAllPreferences(sortPreferences));

	const allowCrashReport = yield RocketChat.getAllowCrashReport();
	yield put(toggleCrashReport(allowCrashReport));

	const allowAnalyticsEvents = yield RocketChat.getAllowAnalyticsEvents();
	yield put(toggleAnalyticsEvents(allowAnalyticsEvents));
};

const restore = function* restore() {
	try {
		const { token, server } = yield all({
			token: UserPreferences.getStringAsyncWithOldVersion(RocketChat.TOKEN_KEY),
			server: UserPreferences.getStringAsync(RocketChat.CURRENT_SERVER)
		});
		console.log('token, server', token, server);
		const sortPreferences = yield RocketChat.getSortPreferences();
		yield put(setAllPreferences(sortPreferences));

		if (!token) {
			yield UserPreferences.removeItem(RocketChat.TOKEN_KEY)

			yield put(serverRequest(DEFAULT_SERVER));
			yield put(appStart({ root: ROOT_OUTSIDE }));
		} else {
			yield put(selectServerRequest(server??DEFAULT_SERVER));
		}

		yield put(appReady({}));
	} catch (e) {
		log(e, 'State Restore Error');
		yield put(appStart({ root: ROOT_OUTSIDE }));
	}
};

const start = function start() {
	RNBootSplash.hide();
};

const root = function* root() {
	yield takeLatest(APP.INIT, restore);
	yield takeLatest(APP.START, start);
	yield takeLatest(APP.INIT_LOCAL_SETTINGS, initLocalSettings);
};
export default root;

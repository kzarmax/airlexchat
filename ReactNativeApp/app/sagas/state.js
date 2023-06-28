import { takeLatest, select } from 'redux-saga/effects';

import RocketChat from '../lib/rocketchat';
import { setBadgeCount } from '../notifications/push';
import database from '../lib/database';
import { Q } from '@nozbe/watermelondb';
import log from '../utils/log';
import { APP_STATE } from '../actions/actionsTypes';
import { ROOT_OUTSIDE } from '../actions/app';

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === ROOT_OUTSIDE) {
		return;
	}

	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		return;
	}

	try {
		return yield RocketChat.setUserPresenceOnline();
	} catch (e) {
		log(e, 'State Update Error:');
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const appRoot = yield select(state => state.app.root);
	if (appRoot === ROOT_OUTSIDE) {
		setBadgeCount(0);
		return;
	}

	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		setBadgeCount(0);
		return;
	}

	try {
		try{
			let count = 0;
			const db = database.active;
			const unreadSubs = yield db.collections
				.get('subscriptions')
				.query(
					Q.where('archived', false),
					Q.where('open', true),
					Q.where('unread', Q.gt(0))
				)
				.fetch();

			const filterIsUnread = s => (s.unread > 0 || s.alert) && !s.hideUnreadStatus;
			unreadSubs.forEach(sub=> {
				if(filterIsUnread(sub)){
					count+=sub.unread;
				}
			});
			setBadgeCount(count);
		} catch (e) {
			log(e);
		}
		yield RocketChat.setUserPresenceAway();
	} catch (e) {
		log(e, 'State Update Error:');
	}
};

const appHasInActive = function * appHasInActive(){
	const auth = yield select(state => state.login.isAuthenticated);
	if (!auth) {
		setBadgeCount(0);
		return;
	}

	try{
		let count = 0;
		const db = database.active;
		const unreadSubs = yield db.collections
			.get('subscriptions')
			.query(
				Q.where('archived', false),
				Q.where('open', true),
				Q.where('unread', Q.gt(0))
			)
			.fetch();

		const filterIsUnread = s => (s.unread > 0 || s.alert) && !s.hideUnreadStatus;
		unreadSubs.forEach(sub=> {
			if(filterIsUnread(sub)){
				count+=sub.unread;
			}
		});
		setBadgeCount(count);
	} catch (e) {
		log(e);
	}
}

const root = function* root() {
	yield takeLatest(APP_STATE.FOREGROUND, appHasComeBackToForeground);
	yield takeLatest(APP_STATE.BACKGROUND, appHasComeBackToBackground);
	yield takeLatest(APP_STATE.INACTIVE, appHasInActive);
};

export default root;

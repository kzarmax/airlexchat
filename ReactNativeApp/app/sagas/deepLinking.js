import {
	takeLatest, take, select, put, all
} from 'redux-saga/effects';

import UserPreferences from '../lib/userPreferences';
import Navigation from '../lib/Navigation';
import * as types from '../actions/actionsTypes';
import { selectServerRequest, serverInitAdd } from '../actions/server';
import { inviteLinksSetToken, inviteLinksRequest } from '../actions/inviteLinks';
import database from '../lib/database';
import RocketChat from '../lib/rocketchat';

import {
	appStart, ROOT_INSIDE, appInit, ROOT_OUTSIDE
} from '../actions/app';
import { goRoom } from '../utils/goRoom';

const roomTypes = {
	channel: 'c', direct: 'd', group: 'p', channels: 'l'
};

const handleInviteLink = function* handleInviteLink({ params, requireLogin = false }) {
	if (params.path && params.path.startsWith('invite/')) {
		const token = params.path.replace('invite/', '');
		if (requireLogin) {
			yield put(inviteLinksSetToken(token));
		} else {
			yield put(inviteLinksRequest(token));
		}
	}
};

const navigate = function* navigate({ params }) {
	yield put(appStart({ root: ROOT_INSIDE }));
	if (params.path) {
		const [type, name] = params.path.split('/');
		if (type !== 'invite') {
			const room = yield RocketChat.canOpenRoom(params);
			if (room) {
				const isMasterDetail = yield select(state => state.app.isMasterDetail);
				if (isMasterDetail) {
					Navigation.navigate('DrawerNavigator');
				} else {
					Navigation.navigate('RoomsListView');
				}
				const item = {
					name,
					t: roomTypes[type],
					roomUserId: RocketChat.getUidDirectMessage(room),
					...room
				};

				goRoom({item, isMasterDetail});

				if (params.isCall) {
					RocketChat.callJitsi(item.rid, room.cardId, params.messageType === 'jitsi_call_started');
				}

			}
		} else {
			yield handleInviteLink({ params });
		}
	}
};

const fallbackNavigation = function* fallbackNavigation() {
	const currentRoot = yield select(state => state.app.root);
	if (currentRoot) {
		return;
	}
	yield put(appInit());
};

const handleOpen = function* handleOpen({ params }) {
	const serversDB = database.servers;
	const serversCollection = serversDB.collections.get('servers');

	let { host } = params;
	if (params.isCall && !host) {
		const servers = yield serversCollection.query().fetch();
		// search from which server is that call
		servers.forEach(({ uniqueID, id }) => {
			if (params.path.includes(uniqueID)) {
				host = id;
			}
		});
	}

	// If there's no host on the deep link params and the app is opened, just call appInit()
	if (!host) {
		yield fallbackNavigation();
		return;
	}

	// If there's host, continue
	if (!/^(http|https)/.test(host)) {
		host = `https://${ host }`;
	} else {
		// Notification should always come from https
		//host = host.replace('http://', 'https://');
	}
	// remove last "/" from host
	if (host.slice(-1) === '/') {
		host = host.slice(0, host.length - 1);
	}

	const [server, user] = yield all([
		UserPreferences.getStringAsync(RocketChat.CURRENT_SERVER),
		UserPreferences.getStringAsync(`${ RocketChat.TOKEN_KEY }-${ host }`)
	]);

	// TODO: need testing more
	// if deep link is from same server
	if (server === host && user) {
		const connected = yield select(state => state.meteor.connected);
		if (!connected) {
			yield put(selectServerRequest(host));
			yield take(types.LOGIN.SUCCESS);
		}
		yield navigate({ params });
	} else {
		// search if deep link's server already exists
		try {
			const servers = yield serversCollection.find(host);
			if (servers && user) {
				yield put(selectServerRequest(host));
				yield take(types.LOGIN.SUCCESS);
				yield navigate({ params });
				return;
			}
		} catch (e) {
			// do nothing?
		}
		// if deep link is from a different server
		const result = yield RocketChat.getServerInfo(host);
		if (!result.success) {
			// Fallback to prevent the app from being stuck on splash screen
			yield fallbackNavigation();
			return;
		}
		yield put(appStart({ root: ROOT_OUTSIDE }));
		yield put(serverInitAdd(server));

		if (params.token) {
			yield take(types.SERVER.SELECT_SUCCESS);
			yield RocketChat.connect({ server: host, user: { token: params.token } });
			yield take(types.LOGIN.SUCCESS);
			yield navigate({ params });
		} else {
			yield handleInviteLink({ params, requireLogin: true });
		}
	}
};

const root = function* root() {
	yield takeLatest(types.DEEP_LINKING.OPEN, handleOpen);
};
export default root;

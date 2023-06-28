import {
	Alert, Linking, Platform
} from 'react-native';
import semver from 'semver';
import { takeLatest, put, all } from 'redux-saga/effects';
import DeviceInfo from 'react-native-device-info';
import { APP, APP_STATE } from '../actions/actionsTypes';
import { serverFailure } from '../actions/server';
import RocketChat from '../lib/rocketchat';
import log from '../utils/log';
import I18n from '../i18n';
import UserPreferences from "../lib/userPreferences";

// 現在利用しているアプリのバージョンを取得する
const appVersion = DeviceInfo.getVersion();

// ストアのURLを開く
const openStoreUrl = function openStoreUrl() {
	// iOSとAndroidでストアのURLが違うので分岐する
	if (Platform.OS === 'ios') {
		const appId = '1466592518'; // AppStoreのURLから確認できるアプリ固有の数値
		const itunesURLScheme = `itms-apps://itunes.apple.com/jp/app/id${ appId }?mt=8`;
		const itunesURL = `https://itunes.apple.com/jp/app/id${ appId }?mt=8`;

		Linking.canOpenURL(itunesURLScheme).then((supported) => {
			// AppStoreアプリが開ける場合はAppStoreアプリで開く。開けない場合はブラウザで開く。
			if (supported) {
				Linking.openURL(itunesURLScheme);
			} else {
				Linking.openURL(itunesURL);
			}
		});
	} else {
		const appId = 'chat.airlex.reactnative'; // PlayストアのURLから確認できるid=?の部分
		const playStoreURLScheme = `market://details?id=${ appId }`;
		const playStoreURL = `https://play.google.com/store/apps/details?id=${ appId }`;

		Linking.canOpenURL(playStoreURLScheme).then((supported) => {
			// Playストアアプリが開ける場合はPlayストアアプリで開く。開けない場合はブラウザで開く。
			if (supported) {
				Linking.openURL(playStoreURLScheme);
			} else {
				Linking.openURL(playStoreURL);
			}
		});
	}
};

// アラートの表示
const showUpdateAlert = function showUpdateAlert() {
	Alert.alert('更新情報', '新しいバージョンが利用可能です。最新版にアップデートしてご利用ください。', [
			{ text: 'アップデート', onPress: () => openStoreUrl() }
		],
		{
			cancelable: false
		});
};

function* appInit() {
	const server = yield UserPreferences.getStringAsync(RocketChat.CURRENT_SERVER);

	// サーバー情報が取得できたら処理
	if (server) {
		try {
			// 接続テスト
			const result = yield RocketChat.testServer(server);
			if (!result.success) {
				Alert.alert(I18n.t('Oops'), I18n.t(result.message, result.messageOptions));
				yield put(serverFailure());
				return;
			}

			if (result.success && result.versions) {
				if (Platform.OS === 'ios') {
					if (semver.lt(appVersion, result.versions.reactnative_ios)) {
						showUpdateAlert();
					}
				} else if (semver.lt(appVersion, result.versions.reactnative_android)) {
					showUpdateAlert();
				}
			}
		} catch (e) {
			yield put(serverFailure());
			log(e);
		}
	}
};
// 新しいバージョンのアプリがストアに配布されている場合は更新を促す


const root = function* root() {
	yield takeLatest(
		APP.INIT,
		appInit
	);
};
export default root;

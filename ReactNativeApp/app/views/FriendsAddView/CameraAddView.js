import React from 'react';
import PropTypes from 'prop-types';
import {Text, View} from 'react-native';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { request, PERMISSIONS } from 'react-native-permissions';

import I18n from '../../i18n';
import styles from './styles';
import Button from '../../containers/Button';
import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import { LOG_L_LOW, LOG_L_MIDDLE } from '../../utils/log';
import {getUTCTimeStamp} from "../../lib/utils";


export default class CameraAddView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		focusedScreen: PropTypes.bool,
		navigation: PropTypes.object,
		selected: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		// 初期値の設定
		this.state = {
			hasCameraPermission: false
		};

		this.scanner = null;

		// カメラの権限を求める
		this._requestCameraPermission();
	}

	// カメラの権限を取得
	_requestCameraPermission = () => {
		request(
			Platform.select({
				android: PERMISSIONS.ANDROID.CAMERA,
				ios: PERMISSIONS.IOS.CAMERA
			})
		)
			.then((response) => {
				this.setState({ hasCameraPermission: response });
			});
	};

	// QRコード読み取り時の処理
	onSuccess = async(e) => {
		LOG_L_LOW('Carmera QR Scan Sucees', e);
		const { navigation } = this.props;
		const check = await this.qrCheck(e.data);

		if (check.success) {
			if (check.card) {
				navigation.navigate('QRAfterReadView', check.card);
			} else if (check.group) {
				navigation.navigate('RoomsListView');
				showToast('グループに参加しました。');
			}
		} else {
			showToast(check.error);
		}
		// QRコードスキャナーを初期化
		// this.startScan();
	};

	// 読み込んだQRコードのチェック
	qrCheck = async(url) => {
		const part = url.split('/');
		const { baseUrl, user, selected } = this.props;

		LOG_L_MIDDLE('QR CODE : ', url, part);
		// URLがベースと同じかチェック
		if (baseUrl === `https://${ part[2] }` || baseUrl === `http://${ part[2] }`) {
			const _id = part[3];
			const _time = Number(part[4]);
			const _type = part[5];
			// 現在の時刻を取得
			const nowtime = getUTCTimeStamp();

			// QRコードを生成して30分以内か
			if (_time + 1800 > nowtime) {
				if (_type === 'group') {
					try {
						const group = await RocketChat.inviteGroup(_id, part[6], selected._id);
						return {
							success: true,
							group
						};
					} catch (e) {
						if(e.data && e.data.errorType === 'error-same-user'){
							return {
								success: false,
								error: I18n.t('err_same_user_in_group')
							};
						} else {
							return {
								success: false,
								error: '有効なQRコードではありません。'
							};
						}
					}
				} else {
					// IDが存在するか
					const card = await RocketChat.getCardInfo(_id);

					// カード情報が取得できたかを確認する
					if (!card.success) {
						return {
							success: false,
							error: '有効なQRコードではありません。'
						};
					}

					// 自分自身のコードでないことを確認する
					if (card.card.userId === user.id) {
						return {
							success: false,
							error: '自分のQRコードです。'
						};
					}

					// 問題なければ、カード情報を返す
					return {
						success: true,
						card
					};
				}
			} else {
				// エラー
				return {
					success: false,
					error: 'QRコードの有効期限が過ぎています。'
				};
			}
		} else {
			// エラー
			return {
				success: false,
				error: 'QRコードの認証に失敗しました。'
			};
		}
	};


	// 自分のQR表示画面へ遷移
	friendsAddQRView = () => {
		const { navigation } = this.props;
		navigation.navigate('FriendsAddQRView');
	};

	startScan = () => {
		if (this.scanner) {
			this.scanner._setScanning(false);
		}
	};

	renderCameraView = () => {
		const { hasCameraPermission } = this.state;
		const { navigation, focusedScreen } = this.props;

		// todo : sometimes show black screen in ios.
		const isFocused = navigation.isFocused();

		if (hasCameraPermission === null) {
			return <View/>;
		} else if (hasCameraPermission === false) {
			return <Text>{ I18n.t('No_access_to_camera') }</Text>;
		} else if (isFocused && focusedScreen) {
			return (
				<View style={ styles.cameraView }>
					<QRCodeScanner
						ref={camera => this.scanner = camera}
						onRead={this.onSuccess}
						containerStyle={styles.cameraCont}
						cameraStyle={styles.cameraMain}
					/>
				</View>
			);
		} else {
			return <View/>;
		}
	};

	render(){
		const { theme } = this.props;
		return (
			<View key="Camera" style={ styles.bkColor }>
				<View style={styles.cameraTop}>
					<Text style={styles.white}>{I18n.t('CameraTopText1')}</Text>
					<Text style={styles.white}>{I18n.t('CameraTopText2')}</Text>
				</View>
				{ this.renderCameraView() }
				<View style={ styles.cameraBottom }>
					<Button
						onPress={ () => this.friendsAddQRView() }
						testID='sidebar-toggle-status'
						type='primary'
						text={ I18n.t('CameraQRViewText') }
						size='w'
						theme={theme}
					/>
					<Button
						onPress={ () => this.startScan() }
						testID='sidebar-toggle-status'
						type='primary'
						text={ I18n.t('Reload') }
						size='w'
						theme={theme}
					/>
				</View>
			</View>
		);
	}
}

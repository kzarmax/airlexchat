import React from 'react';
import PropTypes from 'prop-types';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import Swipeout from 'react-native-swipeout';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { selectOne } from '../../actions/cards';
import { CloseButtonGoTop } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import log from '../../utils/log';
import RCTextInput from '../../containers/TextInput';
import Button from '../../containers/Button';

import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import PhotoEditor from "react-native-photo-editor";
import Avatar from "../../containers/Avatar";
import CheckBox from "../../containers/CheckBox";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import RNFetchBlob from "rn-fetch-blob";
import {withActionSheet} from "../../containers/ActionSheet";
import {PHOTO_EDITOR_HIDDEN_CONTROLS} from "../../constants/controls";


// カメラ初期設定
const imagePickerConfig = {
	cropping: false,
	compressImageQuality: 0.8,
	enableRotationGesture: true,
	avoidEmptySpaceAroundImage: false,
	cropperChooseText: I18n.t('Choose'),
	cropperCancelText: I18n.t('Cancel'),
	mediaType: 'photo',
	includeBase64: true
};

class NewCardProfileView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		cards: PropTypes.array,
		selectOne: PropTypes.func.isRequired,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		// 前の画面から選択したシーン情報を設定
		this.scene = {
			checked: props.route.params.checked,
			tmpSceneNo: props.route.params.tmpSceneNo,
			addSceneNo: props.route.params.addSceneNo,
			addSceneText: props.route.params.addSceneText
		};

		// この画面の初期値
		this.state = {
			name: '',
			username: '',
			comment: '',
			scene: [],
			profiles: [],
			detail: [],
			checked: [],
			addDetailNo: 0,
			addList: null,
			avatar: [],
			cardAvatar: [],
			type: '',
			isSecret: false,
			password: '',
			password_confirm: '',
			password_error: false,
			password_comfirm_error: false,
			saving: false,
			createdCard: null,
		};

		this.options = [
			{
				title: I18n.t('Take_a_photo'),
				icon: 'image',
				onPress: this.takePhoto
			},
			{
				title: I18n.t('Choose_from_library'),
				icon: 'folder',
				onPress: this.chooseFromLibrary
			}
		];

		props.navigation.setOptions({
			headerLeft: () => <CloseButtonGoTop navigation={props.navigation} testID='newcard-profile-view' />,
			title: I18n.t('Card_Creating')
		});

		this.init();
	}

	// シーン詳細取得
	init = async() => {
		const id = this.scene.checked;
		const input = [];
		let profiles = [];
		let _scene = [];
		let sceneBase = [];

		const { scene } = await RocketChat.getSceneInfo(id);
		_scene = scene;
		profiles = scene.values;

		// ベース配列を生成
		if (profiles) {
			for (let i = 0; i < profiles.length; i += 1) {
				input[i] = {
					name: profiles[i].name,
					type: profiles[i].type
				};
			}
		}
		// シーン情報の設定
		sceneBase = {
			code: id,
			name: _scene.name
		};

		// シーン詳細の一覧を設定
		this.setState({
			name: _scene.name,
			detail: profiles,
			profiles: input,
			scene: sceneBase
		});
	}

	valid = () => {
		const {
			password, password_confirm
		} = this.state;
		return password.trim()
			&& password_confirm.trim()
			&& (password.trim().length >= 8)
			&& (password.trim().length <= 32)
			&& (password.trim() === password_confirm.trim());
	};

	// 登録処理
	submit = async() => {
		const {
			name, username, comment, scene, profiles, avatar, cardAvatar, isSecret, password, password_confirm, createdCard
		} = this.state;
		const { cards, selectOne } = this.props;

		if (isSecret && !this.valid()) {
			if (!(password.trim().length >= 8)) {
				this.setState({ password_error: true });
			}
			if (!(password.trim().length <= 32)) {
				this.setState({ password_error: true });
			}
			if (password.trim() !== password_confirm.trim()) {
				this.setState({ password_confirm_error: true });
			}

			return;
		}

		this.setState({ saving: true });

		const params = {
			name,
			username,
			comment,
			scene,
			isSecret,
			profiles
		};

		if(isSecret){
			params.password = password;
		}

		let error = false;
		// カード名の重複チェック
		cards.filter((item) => {
			if (item.name === name) {
				error = true;
			}
		});
		if (error) {
			showToast(I18n.t('error-card-name'));
			this.setState({ saving: false });
			return;
		}

		let newCard = null;
		// 実行する
		try {
			if(!createdCard){
				const req = await RocketChat.createCard(params);
				if(req.success){
					this.setState({createdCard: req.card});
					newCard = req.card;
				}
			} else {
				newCard = createdCard
			}

			if (newCard) {
				// データの登録に成功したらカードのアバター画像を登録
				if (avatar.url) {
					await RocketChat.setCardAvatarFromService({
						cardId: newCard._id,
						url: avatar.url,
						contentType: '',
						data: avatar.data,
						service: avatar.service
					});
				}
				// データの登録に成功したらカードのアイコン画像を登録
				if (cardAvatar.url) {
					await RocketChat.setCardImageFromService({
						cardId: newCard._id,
						url: cardAvatar.url,
						contentType: '',
						data: cardAvatar.data,
						service: cardAvatar.service
					});
				}

				showToast(I18n.t('new_card_save_true'));

				// 最新のカード一覧を設定する
				selectOne({id: newCard._id, callback: ()=>{}});

				const { navigation } = this.props;
				navigation.navigate('RoomsListView');
				return;
			}
			showToast(I18n.t('err_creat_card'));
		} catch (e) {
			if(newCard){
				showToast(I18n.t('err_upload_card_images'));
			} else {
				showToast(I18n.t('err_creat_card'));
			}
			log(e);
		}
		this.setState({ saving: false });
	}

	toggleCheck = () => {
		const { isSecret } = this.state;
		this.setState({ isSecret: !isSecret });
	}

	// ファイル選択のモーダル状態セット
	toggleFilesActions = (type) => {
		// クリックした場合のみセットする（モーダルを閉じる時も動作するので、空で上書きされるのを防いでいる）
		if (type) {
			this.setState({ type });
		}
		const { showActionSheet } = this.props;
		showActionSheet({ options: this.options });
	}

	// カメラから選択を選んだ場合
	takePhoto = async() => {
		try {
			const image = await ImagePicker.openCamera(imagePickerConfig);
			this.editImage(image);
		} catch (e) {
			log(e);
		}
	}

	// フォルダから選択を選んだ場合
	chooseFromLibrary = async() => {
		try {
			const image = await ImagePicker.openPicker(imagePickerConfig);
			this.editImage(image);
		} catch (e) {
			log(e);
		}
	}

	editImage = (image) => {
		if(image && image.path){
			let image_path = image.path.replace('file://', '');
			PhotoEditor.Edit({ path: image_path, hiddenControls: PHOTO_EDITOR_HIDDEN_CONTROLS, onDone: async(path) => {
					const data = await RNFetchBlob.fs.readFile(image_path, "base64");
					let editImage = {
						...image,
						data
					}
					this.setPart(editImage);
				} });
		}
	}

	// セット判別
	setPart = (image) => {
		const { type } = this.state;

		if (type === 'card') {
			this.setCardAvatar({ url: image.path, data: `data:image/jpeg;base64,${ image.data }`, service: 'upload' });
		} else {
			this.setAvatar({ url: image.path, data: `data:image/jpeg;base64,${ image.data }`, service: 'upload' });
		}
	}

	// カード画像をセット
	setCardAvatar = (cardAvatar) => {
		this.setState({ cardAvatar });
	}

	// ユーザ画像をセット
	setAvatar = (avatar) => {
		this.setState({ avatar });
	}

	// シーン詳細の入力内容を配列にセット
	setProfile = (title, value, no) => {
		const { profiles } = this.state;
		const input = profiles;

		switch (title) {
			case 'name':
				input[no] = { ...input[no], name: value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			case 'value':
				input[no] = { ...input[no], value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			case 'public':
				input[no] = { ...input[no], public: value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			default:
				break;
		}

		this.setState({ profiles: input });
	}

	// シーンの削除
	sceneDelete = (i) => {
		const {
			detail, checked, addDetailNo, addList, profiles, profileNo
		} = this.state;

		if (!detail) {
			return;
		}
		let _detail = detail;
		let _checked = checked;
		let _addDetailNo = addDetailNo;
		let _addList = addList;
		let _profiles = profiles;
		let _profileNo = profileNo;


		// 各配列項目の調整
		_checked.splice(i, 1);
		_profiles.splice(i, 1);
		_profileNo = _profiles.length;

		if (i < _detail.length) {
			_detail.splice(i, 1);
		} else {
			i = i - _detail.length;
			_addList.splice(i, 1);
			_addDetailNo = _addList.length;
		}

		this.setState({
			detail: _detail,
			checked: _checked,
			addDetailNo: _addDetailNo,
			addList: _addList,
			profiles: _profiles,
			profileNo: _profileNo
		});
	}

	renderCreatePassword = () => {
		const {
			password_error, password_confirm_error, isSecret
		} = this.state;
		const { theme } = this.props;

		if(!isSecret)
			return null;

		return (
			<View style={[sharedStyles.container]}>
				{password_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password')}</Text> : null}
				<RCTextInput
					inputRef={(e) => { this.passwordInput = e; }}
					placeholder={I18n.t('Password')}
					returnKeyType='next'
					// iconLeft='key'
					secureTextEntry
					textContentType={'oneTimeCode'}
					onChangeText={value => this.setState({ password: value })}
					onSubmitEditing={() => { this.passwordConfirmInput.focus(); }}
					testID='register-view-password'
					theme={theme}
				/>
				<Text>{I18n.t('Card_Password_policy')}</Text>
				{password_confirm_error ? <Text style={{ color: '#ff0000' }}>{I18n.t('error-invalid-password-repeat')}</Text> : null}
				<RCTextInput
					inputRef={(e) => { this.passwordConfirmInput = e; }}
					placeholder={I18n.t('Repeat_Password')}
					returnKeyType='send'
					// iconLeft='key'
					secureTextEntry
					textContentType={'oneTimeCode'}
					onChangeText={value => this.setState({ password_confirm: value })}
					testID='register-view-password-confirm'
					containerStyle={sharedStyles.inputLastChild}
					theme={theme}
				/>
			</View>
		);
	};

	// シーンの詳細項目を表示
	sceneRender = () => {
		const {
			detail, checked, addDetailNo, addList, profiles
		} = this.state;
		const { theme } = this.props;

		const checks = checked;
		const addNo = addDetailNo;
		const rows = [];

		// テンプレートの表示
		if (detail) {
			for (let i = 0; i < detail.length; i += 1) {
				let isCheck = true;
				if (!checks[i] && !profiles[i].public) {
					isCheck = profiles[i].public;
				}
				if (checks[i] === false) {
					isCheck = checks[i];
				}

				if (detail[i].name) {
					const swipeoutBtns = [{
						text: '削除',
						backgroundColor: '#F95522',
						onPress: () => this.sceneDelete(i)
					}];

					rows.push(
						<Swipeout
							key={`swipout-key-${ i }`}
							right={swipeoutBtns}
							backgroundColor={ themes[theme].backgroundColor }
							style={{ borderRadius: 5 }}
							autoClose
						>
							<View style={styles.detailBox} key={`default-list-key-${ i }`}>
								<View style={styles.detailTitleArea}>
									<RCTextInput
										inputRef={(e) => { this.profiles = e; }}
										placeholder={detail[i].name}
										onChangeText={value => this.setProfile('name', value, i)}
										onSubmitEditing={() => { this.profiles.focus(); }}
										testID='new_card_profile_comment'
										style={styles.detailTitle}
										value={profiles[i].name}
										theme={theme}
									/>
								</View>
								<View style={styles.detailMainArea}>
									<RCTextInput
										inputRef={(e) => { this.profiles = e; }}
										placeholder={I18n.t('Please_enter')}
										onChangeText={value => this.setProfile('value', value, i)}
										onSubmitEditing={() => { this.profiles.focus(); }}
										testID='new_card_profile_comment'
										style={styles.detailMain}
										theme={theme}
									/>
								</View>
								<View style={styles.iconArea}>
									<CheckBox
										checkedIcon='eye'
										uncheckedIcon='eye'
										checked={isCheck}
										checkedColor={ themes[theme].bodyText }
										unCheckedColor={ themes[theme].inactiveTintColor }
										containerStyle={{ marginBottom: 10}}
										onPress={() => this.setCheck(i)}
										onIconPress={() => this.setCheck(i)}
									/>
								</View>
							</View>
						</Swipeout>
					);
				}
			}
		}

		// 追加項目の表示
		if (addList != null) {
			const profileCount = detail && detail.length ? detail.length : 0;
			for (let j = 0; j < addNo; j += 1) {
				const no = profileCount + j;
				let isCheck = true;
				if (checks[no] === false) {
					isCheck = checks[no];
				}
				const swipeoutBtns = [{
					text: '削除',
					backgroundColor: '#F95522',
					onPress: () => this.sceneDelete(no)
				}];

				let _name = '';
				let _value = '';
				if (profiles[no]) {
					_name = profiles[no].name;
					_value = profiles[no].value;
				}
				rows.push(
					<Swipeout
						key={`add-list-swipeout-key-${ j }`}
						right={swipeoutBtns}
						backgroundColor={ themes[theme].backgroundColor }
						style={{borderRadius: 5}}
						autoClose={true}
					>
						<View style={styles.detailBox} key={`add-list-key-${ j }`}>
							<View style={styles.detailTitleArea}>
								<RCTextInput
									inputRef={(e) => { this.profiles = e; }}
									placeholder={I18n.t('Please_enter')}
									onChangeText={value => this.setProfile('name', value, no)}
									onSubmitEditing={() => { this.profiles.focus(); }}
									testID='new_card_profile_comment'
									style={styles.detailTitle}
									value={_name}
									theme={theme}
								/>
							</View>
							<View style={styles.detailMainArea}>
								<RCTextInput
									inputRef={(e) => { this.profiles = e; }}
									placeholder={I18n.t('Please_enter')}
									onChangeText={value => this.setProfile('value', value, no)}
									onSubmitEditing={() => { this.profiles.focus(); }}
									testID='new_card_profile_comment'
									style={styles.detailMain}
									value={_value}
									theme={theme}
								/>
							</View>
							<View style={styles.iconArea}>
								<CheckBox
									checkedIcon='eye'
									uncheckedIcon='eye'
									checked={isCheck}
									checkedColor={ themes[theme].bodyText }
									unCheckedColor={ themes[theme].inactiveTintColor }
									containerStyle={{ marginBottom: 10}}
									onPress={() => this.setCheck(no)}
									onIconPress={() => this.setCheck(no)}
								/>
							</View>
						</View>
					</Swipeout>
				);
			}
		}
		return rows;
	}

	// チェック状態の保存
	setCheck = (count) => {
		const {
			checked
		} = this.state;
		const checks = checked;

		// チェックフラグがない場合
		checks[count] = !(checks[count]);

		this.setProfile('public', checks[count], count);
		this.setState({ checked: checks });
	}

	// 自由項目の追加
	addSceneDetail = () => {
		const {
			addDetailNo, addList
		} = this.state;
		let addProfileList = [];
		const addNo = addDetailNo + 1;

		// 既に項目がある場合はaddList配列へ設定
		if (addList) {
			addProfileList = addList;
		}
		addProfileList.push(addNo);

		this.setState({
			addDetailNo: addNo,
			addList: addProfileList
		});

		// 追加シーンを表示
		this.sceneRender();
	}

	// 保存ボタンのON/OFF
	formIsChanged = () => {
		const {
			name, username
		} = this.state;

		let disabled = false;
		// 必須チェックをカード名と名前だけに変更
		if (!name || !username) {
			disabled = true;
		}
		return disabled;
	}

	render() {
		const {
			avatar, cardAvatar, saving, name, isSecret
		} = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='profilard_scene-view'
				>
					<View style={styles.avatarContainer} testID='new-card-profile-avatar'>
						<Avatar
							size={76}
							borderRadius={5}
							backIcon={'address-card'}
							style={{ backgroundColor: '#a1c3e6' }}
							onPress={() => this.toggleFilesActions('card')}
							avatar={cardAvatar?.url}
							isStatic={!!(cardAvatar.data)}
						>
							<TouchableOpacity onPress={() => this.toggleFilesActions('card')} style={styles.subAvatarIcon}>
								<MaterialIcons size={18} name={'camera-alt'} color={'white'}/>
							</TouchableOpacity>
						</Avatar>
						<View style={styles.avatarSide}>
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label={I18n.t('new_card_profile_card_name')}
								required={I18n.t('Required')}
								placeholder={I18n.t('new_card_profile_card_name')}
								onChangeText={value => this.setState({ name: value })}
								onSubmitEditing={() => { this.username.focus(); }}
								testID='new_card_profile_card_name'
								value={name}
								theme={theme}
							/>
						</View>
					</View>
					<View style={styles.border} />
					<View style={styles.avatarContainer} testID='new-card-profile-avatar'>
						<Avatar
							size={76}
							borderRadius={40}
							backIcon={'user'}
							style={{ backgroundColor: '#a1c3e6' }}
							onPress={() => this.toggleFilesActions('user')}
							avatar={avatar?.url}
							isStatic={!!(avatar.data)}
						>
							<TouchableOpacity onPress={() => this.toggleFilesActions('user')} style={styles.subAvatarIcon}>
								<MaterialIcons size={18} name={'camera-alt'} color={'white'}/>
							</TouchableOpacity>
						</Avatar>
						<View style={styles.avatarSide}>
							<RCTextInput
								inputRef={(e) => { this.username = e; }}
								label={I18n.t('new_card_profile_user_name')}
								required={I18n.t('Required')}
								placeholder={I18n.t('new_card_profile_user_name')}
								onChangeText={value => this.setState({ username: value })}
								onSubmitEditing={() => { this.comment.focus(); }}
								testID='new_card_profile_user_name'
								theme={theme}
							/>
						</View>
					</View>
					<View>
						<RCTextInput
							inputRef={(e) => { this.comment = e; }}
							label={I18n.t('new_card_profile_comment')}
							placeholder={I18n.t('new_card_profile_comment')}
							onChangeText={value => this.setState({ comment: value })}
							onSubmitEditing={() => { this.comment.focus(); }}
							testID='new_card_profile_comment'
							theme={theme}
						/>
					</View>
					{this.sceneRender()}
					<View>
						<CheckBox
							title={I18n.t('Secret_Mode')}
							checked={isSecret}
							onPress={() => this.toggleCheck()}
							onIconPress={() => this.toggleCheck()}
							checkedIcon='check-square-o'
							uncheckedIcon='square-o'
							checkedColor='red'
							unCheckedColor={themes[theme].bodyText}
							textStyle={{ color: themes[theme].bodyText }}
							containerStyle={{ backgroundColor: 'transparent', marginBottom: 4 }}
						/>
					</View>
					{this.renderCreatePassword()}
					<View style={styles.addSceneDetailBtn}>
						<Button
							onPress={() => this.addSceneDetail()}
							testID='sidebar-toggle-status'
							type='primary'
							text={I18n.t('new_card_profile_add_btn')}
							size='w'
							icon='plus'
							theme={theme}
						/>
					</View>
					<View>
						<Button
							disabled={this.formIsChanged()}
							onPress={() => this.submit()}
							testID='sidebar-toggle-status'
							type='done'
							text={I18n.t('Done')}
							size='w'
							loading={saving}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		customFields: state.login.user && state.login.user.customFields,
		emails: state.login.user && state.login.user.emails,
		token: state.login.user && state.login.user.token
	},
	cards: state.cards && state.cards.cards,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	selectOne: params => dispatch(selectOne(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withActionSheet(NewCardProfileView)));

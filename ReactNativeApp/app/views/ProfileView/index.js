import React from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, View, Text, TouchableOpacity, Clipboard
} from 'react-native';

import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import Swipeout from 'react-native-swipeout';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { setCards as setCardsAction, selectOne as selectOneAction } from '../../actions/cards';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import log, { LOG_L_LOW } from '../../utils/log';
import RCTextInput from '../../containers/TextInput';
import Button from '../../containers/Button';

import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import moment from 'moment';
import { withTheme } from '../../theme';
import {COLOR_PRIMARY, themes} from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import EventEmitter from '../../utils/events';
import { LISTENER } from '../../containers/Toast';
import PhotoEditor from "react-native-photo-editor";
import Avatar from "../../containers/Avatar";
import CheckBox from "../../containers/CheckBox";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import RNFetchBlob from "rn-fetch-blob";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {withActionSheet} from "../../containers/ActionSheet";
import equal from 'deep-equal';
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

class ProfileView extends React.Component {

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		navigation: PropTypes.object,
		setCards: PropTypes.func.isRequired,
		selectOneCard: PropTypes.func.isRequired,
		cards: PropTypes.array,
		selected: PropTypes.object,
		theme: PropTypes.string,
	};

	constructor(props) {
		super(props);

		// この画面の初期値
		this.state = {
			cId: '',
			name: '',
			username: '',
			comment: '',
			scene: [],
			profiles: [],
			card_img: null,
			user_img: null,
			detail: [],
			checked: [],
			addDetailNo: 0,
			addList: null,
			avatar: {},
			cardAvatar: {},
			type: '',
			saving: false,
			cardProfile: [],
			profileNo: 0,
			noDeleteFlg: false,
			sceneFlg: null,
			modal: false,
			password: '',
			password_confirm: '',
			isSecret: false,
			isSecreted: false,
			back_color: null,
			text_color: null,
			showSettingBackground: false
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
			title: I18n.t('Card_Editing'),
			tabBarVisible:false
		});

		this.init();
	}

	// 選択カードの取得
	init = async() => {
		const { cards, selected } = this.props;
		const _cardProfile = await RocketChat.getCardInfo(selected._id);

		const cardProfile = _cardProfile.card;
		const _detail = Array.from(cardProfile.profiles);
		let noDeleteFlg = false;
		let sceneFlg = false;

		// 1カードしかない場合は削除ボタンをOFFにする
		if (cards.length === 1) {
			noDeleteFlg = true;
		}

		// シーンがない場合は、シーン追加のボタンをONにする
		if (!cardProfile.scene) {
			sceneFlg = true;
		}

		// カード画像の取得
		const cardAvatar = this.getCardAvater(cardProfile._id);

		// カードのユーザ画像の取得
		const avatar = this.getUserAvater(cardProfile._id);

		const isSecreted = selected.isSecret;

		this.setState({
			cId: cardProfile.cId,
			name: cardProfile.name,
			username: cardProfile.username,
			comment: cardProfile.comment,
			avatar,
			detail: _detail,
			scene: cardProfile.scene,
			profiles: cardProfile.profiles,
			profileNo: cardProfile.profiles.length,
			isSecret: cardProfile.isSecret,
			cardAvatar,
			cardProfile,
			noDeleteFlg,
			sceneFlg,
			isSecreted: isSecreted,
			back_color: (!cardProfile.back_color || cardProfile.back_color === '#')?null:cardProfile.back_color,
			text_color: (!cardProfile.text_color || cardProfile.text_color === '#')?null:cardProfile.text_color,
		});
	};

	componentDidUpdate(prevProps, prevState, snapshot) {
		const { selected } = this.props;
		if(!equal(selected, prevProps.selected)){
			this.init();
		}
	}

	// カード画像の取得
	getCardAvater = (cardId) => {
		const { baseUrl } = this.props;
		const updatedAt = moment().format('YYYYMMDDhhmmss');
		const avatar = {
			url: `${ baseUrl }/card/${ cardId }?updatedAt=${updatedAt}`
		};
		return avatar;
	}

	// カードのユーザ画像の取得
	getUserAvater = (cardId) => {
		const { baseUrl } = this.props;
		const updatedAt = moment().format('YYYYMMDDhhmmss');

		const avatar = {
			url: `${ baseUrl }/avatar/${ cardId }?updatedAt=${updatedAt}`
		};
		return avatar;
	};

	// ファイル選択のモーダル状態セット
	toggleFilesActions = (type) => {
		// クリックした場合のみセットする（モーダルを閉じる時も動作するので、空で上書きされるのを防いでいる）
		if (type) {
			this.setState({ type });
		}
		const { showActionSheet } = this.props;
		showActionSheet({ options: this.options });
	};

	forgotPassword = () => {
		const { navigation, selected } = this.props;
		navigation.navigate('AccountVerifyView', { cardId: selected._id });
	};

	renderChangePassword = () => {
		return (
			<View style={sharedStyles.bottomText}>
				<Text>{I18n.t('if_you_change_your_password')}</Text>
				<Text style={sharedStyles.link} onPress={this.forgotPassword}>{I18n.t('Here')}</Text>
			</View>
		);
	};

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

	// カメラから選択を選んだ場合
	takePhoto = async() => {
		try {
			await ImagePicker.clean();
			const image = await ImagePicker.openCamera(imagePickerConfig);
			this.editImage(image);
		} catch (e) {
			log(e, "Take Photo By Camera Error: ");
		}
	}

	// フォルダから選択を選んだ場合
	chooseFromLibrary = async() => {
		try {
			await ImagePicker.clean();
			const image = await ImagePicker.openPicker(imagePickerConfig);
			this.editImage(image);
		} catch (e) {
			log(e, "Take Photo By Picker Error: ");
		}
	}

	editImage = (image) => {
		if(image && image.path){
			let image_path = decodeURIComponent(image.path.replace('file://', ''));
			PhotoEditor.Edit({ path: image_path, hiddenControls: PHOTO_EDITOR_HIDDEN_CONTROLS, onDone: async (path) => {
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

		this.setState({
			profiles: input
		});
	}

	// シーンの削除
	sceneDelete = (i) => {
		const {
			detail, checked, addDetailNo, addList, profiles, profileNo
		} = this.state;

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

	// シーンの詳細項目を表示
	sceneRender = () => {
		const {
			detail, checked, addDetailNo, addList, profiles
		} = this.state;
		const { theme } = this.props;

		const checks = checked;
		const addNo = addDetailNo;
		const rows = [];

		// APIから取得した列の表示
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
						backgroundColor={themes[theme].backgroundColor}
						style={{ borderRadius: 5 }}
						autoClose
					>
						<View style={styles.detailBox} key={`default-list-key-${ i }`}>
							<View style={styles.detailTitleArea}>
								<RCTextInput
									inputRef={(e) => { this.profiles = e; }}
									placeholder={I18n.t('Please_enter')}
									onChangeText={value => this.setProfile('name', value, i)}
									onSubmitEditing={() => { this.profiles.focus(); }}
									testID='new_card_profile_comment'
									style={styles.detailTitle}
									value={profiles[i].name ? profiles[i].name : ''}
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
									value={profiles[i].value ? profiles[i].value : ''}
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

		// 追加項目の表示
		if (addList != null && addNo > 0) {
			for (let j = 0; j < addNo; j += 1) {
				const no = detail.length + j;
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
						key={`add-list-swipout-key-${ j }`}
						right={swipeoutBtns}
						backgroundColor={themes[theme].backgroundColor}
						style={{ borderRadius: 5 }}
						autoClose
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

		if (checks[count] === true) {
			// 既にチェックフラグがtrue場合
			checks[count] = false;
		} else if (checks[count] === false) {
			// 既にチェックフラグがfalse場合
			checks[count] = true;
		} else {
			// チェックフラグがない場合
			checks[count] = false;
		}
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

	// シークレットモードのON/OFF
	secretMode = () => {

	}

	// カード切り替え処理
	selectCards = async(card) => {
		const { selectOneCard } = this.props;

		selectOneCard({id:card._id, callback:()=>{
				showToast(I18n.t('change_card_true'));
			}});
	};

	// カードの削除処理
	deleteCard = async() => {
		const { user } = this.props;
		const { cardProfile } = this.state;

		const result = await RocketChat.deleteCard(user.userId, cardProfile._id);

		if (result.success) {
			// 選択しているカードを変更する
			this.selectCards(result.cards[0]);

			// 成功メッセージを表示
			showToast(I18n.t('CardDeleteSuccess'));

			// 画面遷移を実行
			const { navigation } = this.props;
			navigation.navigate('RoomsListView', this.state);
		} else {
			showToast(I18n.t('CardDeleteFailure'));
		}
	};

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
			name, username, comment, avatar, cardAvatar, scene, profiles, password, password_confirm, isSecret, isSecreted
		} = this.state;

		const { cards, selected } = this.props;

		if (!isSecreted && isSecret && !this.valid()) {
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
			cardId: selected._id,
			name,
			username,
			comment: comment===""?" ":comment,
			scene,
			isSecret,
			profiles
		};

		if(!isSecreted && isSecret)
			params.password = password;

		let error = false;
		let _cards = [];
		// 現在編集中以外のカードを抽出
		cards.filter((item) => {
			if (item._id !== selected._id) {
				_cards.push(item);
			}
		});
		// カード名の重複チェック
		_cards.filter((item) => {
			if (item.name === name) {
				error = true;
			}
		});
		if (error) {
			showToast(I18n.t('error-card-name'));
			this.setState({ saving: false });
			return;
		}


		// 実行する
		try {
			const req = await RocketChat.updateCard(params);
			if (req.success) {
				LOG_L_LOW('Image Changed :', avatar, cardAvatar);
				if (avatar.url && avatar.data && avatar.service) {
					LOG_L_LOW('setCardAvatarFromService:', avatar);
					await RocketChat.setCardAvatarFromService({
						// データの登録に成功したらカードのアバター画像を登録 変更されていた場合のみ
						cardId: req.card._id,
						data: avatar.data,
						contentType: '',
						service: avatar.service
					});
				}

				// データの登録に成功したらカードのアイコン画像を登録 変更されていた場合のみ
				if (cardAvatar.url && cardAvatar.data && cardAvatar.service) {
					LOG_L_LOW('setCardImageFromService:', cardAvatar);
					await RocketChat.setCardImageFromService({
						cardId: req.card._id,
						data: cardAvatar.data,
						contentType: '',
						service: cardAvatar.service
					});
				}

				showToast(I18n.t('new_card_save_true'));

				// 最新のカード一覧を設定する
				const { setCards } = this.props;
				setTimeout(async () => {
					const { cards } = await RocketChat.getUserCards();
					await setCards(cards);
				}, 500);

				this.setState({ saving: false });
				const { navigation } = this.props;
				navigation.navigate('RoomsListView');
			} else {
				showToast(I18n.t('new_card_save_failed'));
				this.setState({ saving: false });
			}
		} catch (e) {
			log(e, "Save Card Error");
			showToast(I18n.t('new_card_save_failed'));
			this.setState({ saving: false });
		}
	}

	goSceneAdd = () => {
		const { navigation } = this.props;
		navigation.navigate('ProfileSceneAddView', this.state);
	}

	toggleModal = () => {
		const { modal } = this.state;
		this.setState({ modal: !modal });
	}

	toggleSettingBackground = () =>{
		const { navigation } = this.props;
		const { back_color, text_color } = this.state;
		navigation.navigate('SetBackgroundView', { back_color: back_color, text_color: text_color });
	}

	toggleChatConfig = () => {
		const { navigation } = this.props;
		navigation.navigate('ChatConfigView');
	}

	// シークレットモードのON/OFF
	toggleCheck = () => {
		const { isSecret } = this.state;
		this.setState({ isSecret: !isSecret });
	}

	onCopyID = () => {
		const {cId} = this.state;
		if(cId.length){
			Clipboard.setString(cId);
			EventEmitter.emit(LISTENER, { message: I18n.t('ID_Copied_to_clipboard') });
		}
	}

	deleteCheckView = () => {
		const {
			name, modal, cardAvatar, noDeleteFlg
		} = this.state;

		const { theme } = this.props;

		if(!modal)
			return null;
		return (
				<View style={styles.modal}>
					<View style={{ ...styles.modalContent, backgroundColor: themes[theme].focusedBackground }}>
						<TouchableOpacity
							style={styles.closeModalButton}
							onPress={() => this.toggleModal()}
						>
							<FontAwesome name={'times'} size={32} color={themes[theme].bodyText}/>
						</TouchableOpacity>
						<View style={styles.modalAvater}>
							<Avatar
								size={100}
								borderRadius={50}
								backIcon={'address-card'}
								style={{ backgroundColor: '#a1c3e6' }}
								avatar={cardAvatar?.url}
								isStatic={!!(cardAvatar.data)}
							/>
							<Text style={{ ...styles.modalAvaterName, color: themes[theme].bodyText }}>{name}</Text>
						</View>
						<View style={styles.modalMassage}>
							<Text style={{ color: themes[theme].bodyText }}>{I18n.t('CardDeleteCheck')}</Text>
						</View>
						<View style={ styles.modalBtn}>
							<Button
								visible={noDeleteFlg}
								title={I18n.t('Delete')}
								type='danger'
								size='V'
								style={styles.modalButton}
								onPress={()=>this.deleteCard()}
								theme={theme}
							/>
						</View>
					</View>
				</View>
		);
	}

	render() {
		const {
			cId, name, username, comment, avatar, cardAvatar, saving, noDeleteFlg, sceneFlg, isSecret, isSecreted
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
					<TouchableOpacity onPress={this.onCopyID} style={styles.idContainer}>
						<Text style={{ ...styles.idText, color: themes[theme].bodyText }}>ID :</Text>
						{cId.length?[
								<Text style={{ ...styles.idText, color: themes[theme].bodyText }}>{cId}</Text>,
								<CustomIcon name='copy' size={30} color={COLOR_PRIMARY} />,
								<Text style={{ marginLeft: 4,  color: COLOR_PRIMARY }}>「コピーマーク」</Text>
							]
							:
							null
						}
					</TouchableOpacity>
					<View style={styles.border} />
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
							value={username}
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
							value={comment}
							theme={theme}
					/>
					</View>
					{this.sceneRender()}
					<View style={styles.addSceneDetailBtn}>
						<Button
							hidden={sceneFlg}
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
							containerStyle={{ backgroundColor: 'transparent' }}
						/>
					</View>
					{ isSecreted? this.renderChangePassword(): this.renderCreatePassword()}
					<Button
						hidden={!sceneFlg}
						onPress={() => this.goSceneAdd()}
						testID='add-scene'
						type='primary'
						text={I18n.t('Scene_after_add_message')}
						size='w'
						icon='plus'
						theme={theme}
					/>
					<Button
						onPress={() => this.toggleSettingBackground()}
						testID='set-card-background'
						type='primary'
						text={I18n.t('Set_Card_Background')}
						size='w'
						theme={theme}
					/>
					<Button
						onPress={() => this.toggleChatConfig()}
						testID='set-chat-config'
						type='primary'
						text={I18n.t('Set_Chat_Config')}
						size='w'
						theme={theme}
					/>
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
					<View style={styles.deleteBtn}>
						<Button
							hidden={noDeleteFlg}
							onPress={() => this.toggleModal()}
							testID='sidebar-toggle-status'
							type='danger'
							text={I18n.t('CardDelete')}
							size='s'
							icon='trash-o'
							theme={theme}
						/>
					</View>
					</ScrollView>
					{ this.deleteCheckView() }
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
	selected: state.cards && state.cards.selected,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});
const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	setCards: cards => dispatch(setCardsAction(cards)),
	selectOneCard: params => dispatch(selectOneAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withActionSheet(ProfileView)))

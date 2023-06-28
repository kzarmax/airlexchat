import React from 'react';
import PropTypes from 'prop-types';
import {
	View, ScrollView, Alert, TouchableOpacity, Keyboard
} from 'react-native';
import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';

import { deleteRoom as deleteRoomAction } from '../../actions/room';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { showErrorAlert, showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCTextInput from '../../containers/TextInput';
import Loading from '../../containers/Loading';
import Button from '../../containers/Button';
import random from '../../utils/random';
import log from '../../utils/log';
import I18n from '../../i18n';
import StatusBar from '../../containers/StatusBar';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import PhotoEditor from "react-native-photo-editor/index";
import Avatar from "../../containers/Avatar";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import RNFetchBlob from "rn-fetch-blob";
import {withActionSheet} from "../../containers/ActionSheet";
import {PHOTO_EDITOR_HIDDEN_CONTROLS} from "../../constants/controls";

const PERMISSION_SET_READONLY = 'set-readonly';
const PERMISSION_SET_REACT_WHEN_READONLY = 'set-react-when-readonly';
const PERMISSION_ARCHIVE = 'archive-room';
const PERMISSION_UNARCHIVE = 'unarchive-room';
const PERMISSION_DELETE_C = 'delete-c';
const PERMISSION_DELETE_P = 'delete-p';
const PERMISSIONS_ARRAY = [
	PERMISSION_SET_READONLY,
	PERMISSION_SET_REACT_WHEN_READONLY,
	PERMISSION_ARCHIVE,
	PERMISSION_UNARCHIVE,
	PERMISSION_DELETE_C,
	PERMISSION_DELETE_P
];

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

class RoomInfoEditView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		deleteRoom: PropTypes.func,
		user: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const room = props.route.params?.room;
		this.rid = props.route.params?.rid;
		this.permissions = RocketChat.hasPermission(PERMISSIONS_ARRAY, this.rid);

		this.state = {
			room: room,
			name: '',
			description: '',
			topic: '',
			announcement: '',
			joinCode: '',
			nameError: {},
			saving: false,
			t: false,
			ro: false,
			reactWhenReadOnly: false,
			groupAvatar: {},
			type: true
		};

		this.fileOptions = [
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
			title: I18n.t('Group_edit')
		});
	}


	componentDidMount() {
		this.init();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, groupAvatar, type
		} = this.state;
		if (!equal(nextState, this.state)) {
			return true;
		}
		if (!equal(nextState.room, room)) {
			return true;
		}
		if (!equal(nextState.groupAvatar, groupAvatar)) {
			return true;
		}
		if (nextState.type !== type) {
			return true;
		}
		if (!equal(nextProps, this.props)) {
			return true;
		}
		return false;
	}

	componentWillUnmount() {
	}


	init = () => {
		const { room } = this.state;
		const {
			name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCodeRequired
		} = room;
		// fake password just to user knows about it
		this.randomValue = random(15);
		const groupAvatar = this.getGroupAvatar();
		this.setState({
			name,
			description,
			topic,
			announcement,
			t: t === 'p',
			ro,
			reactWhenReadOnly,
			joinCode: joinCodeRequired ? this.randomValue : '',
			groupAvatar
		});
	}

	clearErrors = () => {
		this.setState({
			nameError: {}
		});
	}

	reset = () => {
		this.clearErrors();
		this.init();
	}

	formIsChanged = () => {
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode
		} = this.state;
		return !(room.name === name
			&& room.description === description
			&& room.topic === topic
			&& room.announcement === announcement
			&& this.randomValue === joinCode
			&& room.t === 'p' === t
			&& room.ro === ro
			&& room.reactWhenReadOnly === reactWhenReadOnly
		);
	}

	toggleFilesActions = (type) => {
		// クリックした場合のみセットする（モーダルを閉じる時も動作するので、空で上書きされるのを防いでいる）
		if (type) {
			this.setState({ type });
		}
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
		this.setGroupAvatar({ url: image.path, data: `data:image/jpeg;base64,${ image.data }`, service: 'upload' });
	}

	setGroupAvatar = (groupAvatar) => {
		this.setState({ groupAvatar });
	}

	getGroupAvatar = () => {
		const { baseUrl } = this.props;
		const { room } = this.state;
		const avatar = {
			url: `${ baseUrl }/avatar/room/${ room.rid }`
		};
		return avatar;
	}

	submit = async() => {
		Keyboard.dismiss();
		const {
			room, name, description, topic, announcement, t, ro, reactWhenReadOnly, joinCode, groupAvatar
		} = this.state;

		this.setState({ saving: true });
		let error = false;

		if (!this.formIsChanged()) {
			showErrorAlert(I18n.t('Nothing_to_save'));
			return;
		}

		// Clear error objects
		await this.clearErrors();

		const params = {};

		// Name
		if (room.name !== name) {
			params.roomName = name;
		}
		// Description
		if (room.description !== description) {
			params.roomDescription = description;
		}

		if (room.t !== t) {
			params.roomType = t ? 'p' : 'c';
		}

		try {
			await RocketChat.saveRoomSettings(room.rid, room.cardId, params);
			if (groupAvatar.url && groupAvatar.data && groupAvatar.service) {
				await RocketChat.setGroupAvatar({
					rid: room.rid,
					cardId: room.cardId,
					url: groupAvatar.url,
					contentType: '',
					data: groupAvatar.data,
					service: groupAvatar.service
				});
			}
		} catch (e) {
			if (e.error === 'error-invalid-room-name') {
				this.setState({ nameError: e });
			}
			error = true;
			log(e);
		}

		await this.setState({ saving: false });
		setTimeout(() => {
			if (error) {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_settings') }));
			} else {
				showToast(I18n.t('Settings_succesfully_changed'));
			}
		}, 100);
	}

	delete = () => {
		const { room } = this.state;
		const { deleteRoom } = this.props;

		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Delete_Room_Warning'),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action: I18n.t('Delete') }),
					style: 'destructive',
					onPress: () => deleteRoom(room.rid, room.t, room.cardId)
				}
			],
			{ cancelable: false }
		);
	}

	toggleArchive = () => {
		const { room } = this.state;
		const { rid, archived, t } = room;

		const action = I18n.t(`${ archived ? 'un' : '' }archive`);
		Alert.alert(
			I18n.t('Are_you_sure_question_mark'),
			I18n.t('Do_you_really_want_to_key_this_room_question_mark', { key: action }),
			[
				{
					text: I18n.t('Cancel'),
					style: 'cancel'
				},
				{
					text: I18n.t('Yes_action_it', { action }),
					style: 'destructive',
					onPress: async() => {
						try {
							await RocketChat.toggleArchiveRoom(rid, t, !archived);
						} catch (e) {
							log(e);
						}
					}
				}
			],
			{ cancelable: false }
		);
	}

	toggleFilesActions = (type) => {
		// クリックした場合のみセットする（モーダルを閉じる時も動作するので、空で上書きされるのを防いでいる）
		if (type) {
			this.setState({ type });
		}
		const { showActionSheet } = this.props;
		showActionSheet({ options: this.fileOptions });
	}

	resetAvatar = () => {
		this.setState({ groupAvatar: {} });
	}

	hasArchivePermission = () => (
		this.permissions[PERMISSION_ARCHIVE] || this.permissions[PERMISSION_UNARCHIVE]
	);

	render() {
		const {
			name, nameError, description, saving, groupAvatar
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
					testID='room-info-edit-view-list'
					{...scrollPersistTaps}
				>
					<View style={styles.rowContainer} testID='new-card-profile-avatar'>
						<Avatar
							size={100}
							borderRadius={50}
							backIcon={'users'}
							style={{ backgroundColor: '#a1c3e6' }}
							onPress={() => this.toggleFilesActions('groupAvatar')}
							avatar={groupAvatar?.url}
							isStatic={!!(groupAvatar.data)}
						>
							<TouchableOpacity onPress={() => this.toggleFilesActions('groupAvatar')} style={styles.subAvatarIcon}>
								<MaterialIcons size={18} name={'camera-alt'} color={'white'}/>
							</TouchableOpacity>
						</Avatar>
						<View style={styles.avatarSide}>
							<RCTextInput
								inputRef={(e) => { this.name = e; }}
								label={I18n.t('Name')}
								required={I18n.t('Required')}
								value={name}
								onChangeText={value => this.setState({ name: value })}
								onSubmitEditing={() => { this.description.focus(); }}
								error={nameError}
								testID='room-info-edit-view-name'
								theme={theme}
							/>
						</View>
					</View>
					<RCTextInput
						inputRef={(e) => { this.description = e; }}
						label={I18n.t('Description')}
						value={description}
						onChangeText={value => this.setState({ description: value })}
						onSubmitEditing={() => { this.description.focus(); }}
						testID='room-info-edit-view-description'
						theme={theme}
					/>
					<View style={styles.btnArea}>
						<Button
							testID='room-info-edit-view-submit'
							type='primary'
							text={I18n.t('SAVE')}
							size='w'
							onPress={() => this.submit()}
							theme={theme}
						/>
					</View>
					<Loading visible={saving} />
				</ScrollView>
			</KeyboardView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	},
});

const mapDispatchToProps = dispatch => ({
	deleteRoom: (rid, t, cardId) => dispatch(deleteRoomAction(rid, t, cardId))
});


export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withActionSheet(RoomInfoEditView)));

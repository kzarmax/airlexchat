import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
	View, Text, Switch, ScrollView, StyleSheet, TouchableOpacity
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';

import { createChannelRequest as createChannelRequestAction } from '../actions/createChannel';
import { removeUser as removeUserAction } from '../actions/selectedUsers';
import sharedStyles from './Styles';
import KeyboardView from '../presentation/KeyboardView';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import I18n from '../i18n';
import UserItem from '../presentation/UserItem';
import { showToast } from '../utils/info';
import { isAndroid } from '../utils/deviceInfo';
import StatusBar from '../containers/StatusBar';
import log from '../utils/log';
import RCTextInput from '../containers/TextInput';
import RocketChat from '../lib/rocketchat';
import Button from '../containers/Button';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";
import PhotoEditor from "react-native-photo-editor";
import CheckBox from "../containers/CheckBox";
import Avatar from "../containers/Avatar";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import RNFetchBlob from "rn-fetch-blob";
import {withActionSheet} from "../containers/ActionSheet";
import {PHOTO_EDITOR_HIDDEN_CONTROLS} from "../constants/controls";

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#f7f8fa',
		flex: 1
	},
	list: {
		width: '100%',
		backgroundColor: '#FFFFFF'
	},
	separator: {
		marginLeft: 60
	},
	formSeparator: {
		marginLeft: 15
	},
	input: {
		height: 54,
		paddingHorizontal: 18,
		color: '#9EA2A8',
		backgroundColor: '#fff',
		fontSize: 18
	},
	swithContainer: {
		height: 54,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingHorizontal: 18
	},
	label: {
		color: '#0C0D0F',
		fontSize: 18,
		fontWeight: '500'
	},
	invitedHeader: {
		marginTop: 18,
		marginHorizontal: 15,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	invitedTitle: {
		color: '#2F343D',
		fontSize: 22,
		fontWeight: 'bold',
		lineHeight: 41
	},
	invitedCount: {
		color: '#9EA2A8',
		fontSize: 15
	},
	avatarContainer: {
		marginTop: 18,
		marginBottom: 10,
		flex: 1,
		flexDirection: 'row'
	},
	avatarSide: {
		marginLeft: 20,
		flex: 1
	},
	adhocText: {
		color: '#9EA2A8',
		marginBottom: 30
	},
	subAvatarIcon: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		padding: 2,
		borderRadius: 12,
		backgroundColor: 'gray'
	}
});

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

class CreateGroupView extends React.Component {

	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		create: PropTypes.func.isRequired,
		removeUser: PropTypes.func.isRequired,
		users: PropTypes.array.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		showActionSheet: PropTypes.func,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const cardId = props.route.params.cardId;
		const selected = props.route.params.selected;
		this.state = {
			channelName: '',
			type: true,
			readOnly: false,
			broadcast: false,
			adhoc: false,
			cardId: cardId,
			selected: selected,
			groupAvatar: {},
			creating:false,
			createdGroup:null
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
			title: I18n.t('Create_Group')
		});
	}


	shouldComponentUpdate(nextProps, nextState) {
		const {
			channelName, type, readOnly, broadcast, adhoc, groupAvatar, creating
		} = this.state;
		const {
			users, theme
		} = this.props;
		if (nextState.channelName !== channelName) {
			return true;
		}
		if (nextState.type !== type) {
			return true;
		}
		if (nextState.readOnly !== readOnly) {
			return true;
		}
		if (nextState.broadcast !== broadcast) {
			return true;
		}
		if (nextState.adhoc !== adhoc) {
			return true;
		}
		if (nextState.groupAvatar !== groupAvatar) {
			return true;
		}
		if (nextState.creating !== creating) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		return !equal(nextProps.users, users);

	}

	componentWillUnmount() {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	onChangeText = (channelName) => {
		this.setState({ channelName });
	}

	toggleFilesActions = (type) => {
		const { showActionSheet } = this.props;
		showActionSheet({ options: this.fileOptions });
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
		this.setGroupAvatar({ url: image.path, data: `data:image/jpeg;base64,${ image.data }`, service: 'upload' });
	}

	setGroupAvatar = (groupAvatar) => {
		this.setState({ groupAvatar });
	}

	getGroupAvatar = (cardId, updatedAt) => {
		const { baseUrl } = this.props;
		const avatar = {
			url: `${ baseUrl }/group/${cardId}?${ updatedAt }`
		};
		return avatar;
	}

	submit = async() => {
		const {
			channelName, readOnly, broadcast, type, cardId, adhoc, groupAvatar, creating, createdGroup
		} = this.state;
		const { users: usersProps } = this.props;

		if (!channelName.trim() || creating) {
			return;
		}

		// transform users object into array of usernames
		const users = usersProps.map(user => user.name);

		this.setState({ creating:true });
		// create channel
		let newGroup = null;
		try {
			if(!createdGroup) {
				const result = await RocketChat.createChannel({
					name:channelName, cardId, users, type, readOnly, broadcast, adhoc
				});

				newGroup = result;
				this.setState({ createdGroup:result });
			} else {
				newGroup = createdGroup;
			}
			if (groupAvatar.url && groupAvatar.data && groupAvatar.service) {
				RocketChat.setGroupAvatar({
					rid: newGroup.rid,
					cardId: cardId,
					data: groupAvatar.data,
					contentType: '',
					service: groupAvatar.service
				});
			}



			if (newGroup) {
				const { navigation } = this.props;
				navigation.popToTop();
				navigation.navigate('GroupAddQRView', { rid: newGroup.rid });
			}
		} catch (e) {
			if(newGroup){
				showToast(I18n.t('err_upload_group_image'));
			} else {
				showToast(I18n.t('err_create_group'));
			}
			log(e);
		}
		this.setState({ creating:false });
	}

	removeUser = (user) => {
		const { users, removeUser } = this.props;
		if (users.length === 1) {
			return;
		}
		removeUser(user);
	}

	renderSwitch = ({
		id, value, label, onValueChange, disabled = false
	}) => (
		<View style={styles.swithContainer}>
			<Text style={styles.label}>{I18n.t(label)}</Text>
			<Switch
				value={value}
				onValueChange={onValueChange}
				testID={`create-channel-${ id }`}
				onTintColor='#2de0a5'
				tintColor={isAndroid ? '#f5455c' : null}
				disabled={disabled}
			/>
		</View>
	)

	renderSeparator = () => <View style={[sharedStyles.separator, styles.separator]} />

	renderItem = ({ item }) => {
		const { baseUrl, user } = this.props;

		return (
			<UserItem
				name={item.fname}
				username={item.name}
				onPress={() => this.removeUser(item)}
				testID={`create-channel-view-item-${ item.name }`}
				baseUrl={baseUrl}
				user={user}
			/>
		);
	}

	toggleCheck = () => {
		const { adhoc } = this.state;
		this.setState({ adhoc: !adhoc });
	}

	formIsChanged = () => {
		const {
			channelName
		} = this.state;

		let disabled = false;
		// 必須チェックをカード名と名前だけに変更
		if (!channelName) {
			disabled = true;
		}
		return disabled;
	}

	render() {
		const {
			channelName, creating, adhoc, groupAvatar
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
					{...scrollPersistTaps}
				>
					<View style={styles.avatarContainer} testID='new-group-profile-avatar'>
						<Avatar
							size={76}
							borderRadius={40}
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
								ref={ref => this.channelNameRef = ref}
								label={I18n.t('Create_Group_Name')}
								placeholder={I18n.t('Create_Group_Name')}
								onChangeText={(value) => this.onChangeText(value)}
								testID='create-channel-name'
								value={channelName}
								theme={theme}
							/>
						</View>
					</View>
					<View>
						<CheckBox
							title={I18n.t('Create_Adhoc_Group')}
							checked={adhoc}
							onPress={() => this.toggleCheck()}
							onIconPress={() => this.toggleCheck()}
							checkedIcon='check-square-o'
							uncheckedIcon='square-o'
							checkedColor='red'
							unCheckedColor={themes[theme].bodyText}
							textStyle={{ color: themes[theme].bodyText }}
							containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
						/>
						<Text style={{ ...styles.adhocText, color: themes[theme].auxiliaryText }}>{I18n.t('Create_Adhoc_Group_Text')}</Text>
					</View>
					<View>
						<Button
							disabled={this.formIsChanged()}
							onPress={() => this.submit()}
							testID='create-channel'
							type='done'
							text={I18n.t('Create_Group_And_Invite')}
							size='w'
							loading={creating}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}


const mapStateToProps = state => ({
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	users: state.selectedUsers.users,
	user: {
		id: state.login.user && state.login.user.id,
		token: state.login.user && state.login.user.token
	}
});

const mapDispatchToProps = dispatch => ({
	create: data => dispatch(createChannelRequestAction(data)),
	removeUser: user => dispatch(removeUserAction(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(withActionSheet(CreateGroupView)));

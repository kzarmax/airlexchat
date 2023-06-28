import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View,
	Alert,
	Keyboard,
	Image,
	Text,
	NativeModules,
	SafeAreaView
} from 'react-native';
import { connect } from 'react-redux';
import ImagePicker from 'react-native-image-crop-picker';
import equal from 'deep-equal';
import DocumentPicker from 'react-native-document-picker';
import XRegExp from 'xregexp';

import TextInput from '../../presentation/TextInput';
import { KeyboardAccessoryView } from 'react-native-ui-lib/keyboard';
import {
	userTyping as userTypingAction,
	setShowingEmojiKeyboard as setShowingEmojiKeyboardAction,
	setCurrentCustomEmoji as setCurrentCustomEmojiAction
} from '../../actions/room';
import RocketChat from '../../lib/rocketchat';
import styles from './styles';
import database from '../../lib/database';
import RecordAudio from './RecordAudio';
import UploadModal from './UploadModal';
import log, { LOG_L_TOP } from '../../utils/log';
import I18n from '../../i18n';
import ReplyPreview from './ReplyPreview';
import debounce from '../../utils/debounce';
import { isAndroid, isTablet } from '../../utils/deviceInfo';
import {canUploadFile, compressMedia} from '../../utils/media';
import EventEmitter from '../../utils/events';
import { withActionSheet } from '../ActionSheet';
import {
	KEY_COMMAND,
	handleCommandTyping,
	handleCommandSubmit,
	handleCommandShowUpload
} from '../../commands';
import MessageboxContext from './Context';
import { MENTIONS_COUNT_TO_DISPLAY, MENTIONS_TRACKING_TYPE_USERS } from './constants';
import { getUserSelector } from '../../selectors/login';
import { isIOS } from '../../utils/deviceInfo';
import { BorderlessButton } from 'react-native-gesture-handler';
import { CustomIcon } from '../../lib/Icons';
import RCActivityIndicator from '../ActivityIndicator';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import CancelEditingButton from './buttons/CancelEditingButton';
import {themes} from "../../constants/colors";
import PhotoEditor from "react-native-photo-editor";
import RNFetchBlob from "rn-fetch-blob";
import Mentions from "./Mentions";
import random from "../../utils/random";
import {PHOTO_EDITOR_HIDDEN_CONTROLS} from "../../constants/controls";
import {filterMentionName} from "../../utils/mentions";
import {filterRepliedMessage} from "../../utils/url";

require('./EmojiKeyboard');

const imagePickerConfig = {
	cropping: false,
	includeBase64: true,
	writeTempFile: true,
	includeExif: true
};

// Fix IPhone 12 Pro Select Video Bug
const libraryPickerConfig = {
	mediaType: 'any',
	multiple: true,
	compressVideo: false,
	compressVideoPreset: 'Passthrough'
};

const videoPickerConfig = {
	mediaType: 'video',
	includeExif: true
};

class MessageBox extends Component {
	static propTypes = {
		rid: PropTypes.string.isRequired,
		cardId: PropTypes.string.isRequired,
		cardName: PropTypes.string,
		baseUrl: PropTypes.string.isRequired,
		message: PropTypes.object,
		replying: PropTypes.bool,
		replyText: PropTypes.string,
		editing: PropTypes.bool,
		threadsEnabled: PropTypes.bool,
		isFocused: PropTypes.func,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		userEmojis: PropTypes.array,
		roomType: PropTypes.string,
		tmid: PropTypes.string,
		customEmojis: PropTypes.array,
		window: PropTypes.object,
		replyWithMention: PropTypes.bool,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		getCustomEmoji: PropTypes.func,
		editCancel: PropTypes.func,
		editRequest: PropTypes.func,
		onSubmit: PropTypes.func.isRequired,
		typing: PropTypes.func,
		theme: PropTypes.string,
		setShowingEmojiKeyboard: PropTypes.func,
		setCurrentCustomEmoji: PropTypes.func,
		currentCustomEmoji: PropTypes.string,
		replyCancel: PropTypes.func,
		navigation: PropTypes.object,
		children: PropTypes.node,
		isMasterDetail: PropTypes.bool,
		iOSScrollBehavior: PropTypes.number,
		sharing: PropTypes.bool,
		members: PropTypes.array
	};

	static defaultProps = {
		message: {
			id: ''
		},
		sharing: false,
		iOSScrollBehavior: NativeModules.KeyboardTrackingViewManager?.KeyboardTrackingScrollBehaviorFixedOffset,
		getCustomEmoji: () => {},
		members: []
	}

	constructor(props) {
		super(props);
		this.state = {
			mentions: [],
			showEmojiKeyboard: false,
			showSend: false,
			recording: false,
			trackingType: '',
			file: {
				isVisible: false
			},
			isFetching: false,
			isCompressing: false
		};
		this.text = '';
		this.selection = { start: 0, end: 0 };
		this.focused = false;

		// MessageBox Actions
		this.options = [
			{
				title: I18n.t('Take_a_photo'),
				icon: 'camera-photo',
				onPress: this.takePhoto
			},
			{
				title: I18n.t('Take_an_audio'),
				icon: 'microphone',
				onPress: this.recordAudioMessage
			},
			{
				title: I18n.t('Take_a_video'),
				icon: 'camera',
				onPress: this.takeVideo
			},
			{
				title: I18n.t('Choose_from_library'),
				icon: 'folder',
				onPress: this.chooseFromLibrary
			},
			{
				title: I18n.t('Choose_file'),
				icon: 'attach',
				onPress: this.chooseFile
			}
		];

		const libPickerLabels = {
			cropperChooseText: I18n.t('Choose'),
			cropperCancelText: I18n.t('Cancel'),
			loadingLabelText: I18n.t('Processing')
		};
		this.imagePickerConfig = {
			...imagePickerConfig,
			...libPickerLabels
		};
		this.libraryPickerConfig = {
			...libraryPickerConfig,
			...libPickerLabels
		};
		this.videoPickerConfig = {
			...videoPickerConfig,
			...libPickerLabels
		};
	}

	async componentDidMount() {
		const db = database.active;
		const { rid, tmid, navigation } = this.props;
		let msg;
		try {
			const threadsCollection = db.collections.get('threads');
			const subsCollection = db.collections.get('subscriptions');
			if (tmid) {
				try {
					const thread = await threadsCollection.find(tmid);
					if (thread) {
						msg = thread.draftMessage;
					}
				} catch (error) {

				}
			} else {
				try {
					const room = await subsCollection.find(rid);
					msg = room.draftMessage;
				} catch (error) {

				}
			}
		} catch (e) {
		}

		if (msg) {
			this.setInput(msg);
			this.setShowSend(true);
		}

		if (isTablet) {
			EventEmitter.addEventListener(KEY_COMMAND, this.handleCommands);
		}

		this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) =>{
			if(isAndroid){
				this.closeEmoji();
			}
		});

		this.unsubscribeFocus = navigation.addListener('focus', () => {
			if(this.tracking && this.tracking.resetTracking){
				this.tracking.resetTracking();
			}
		});

		this.unsubscribeBlur = navigation.addListener('blur', () => {
			this.component?.blur();
		});
	}


	shouldComponentUpdate(nextProps, nextState) {
		const {
			showEmojiKeyboard, showSend, recording, mentions, file, isFetching, isCompressing
		} = this.state;

		const {
			roomType, replying, replyText, editing, isFocused, userEmojis, window,  currentCustomEmoji, children, members, theme
		} = this.props;

		if (nextProps.theme !== theme) {
			return true;
		}
		if (!isFocused()) {
			return false;
		}
		if (nextProps.roomType !== roomType) {
			return true;
		}
		if (nextProps.replying !== replying) {
			return true;
		}
		if (nextProps.replyText !== replyText) {
			return true;
		}
		if (nextProps.editing !== editing) {
			return true;
		}
		if (nextState.showEmojiKeyboard !== showEmojiKeyboard) {
			return true;
		}
		if (nextState.showSend !== showSend) {
			return true;
		}
		if (nextState.recording !== recording) {
			return true;
		}
		if (!equal(nextState.mentions, mentions)) {
			return true;
		}
		if (!equal(nextState.file, file)) {
			return true;
		}
		if(!equal(nextProps.userEmojis, userEmojis)){
			return true;
		}
		if (nextState.isFetching !== isFetching) {
			return true;
		}
		if (nextState.isCompressing !== isCompressing) {
			return true;
		}
		if (nextProps.currentCustomEmoji !== currentCustomEmoji) {
			return true;
		}
		if (nextProps.children !== children) {
			return true;
		}
		if(!equal(nextProps.members, members)){
			return true;
		}

		return !equal(nextProps.window, window);
	}

	componentWillUnmount() {
		if (this.onChangeText && this.onChangeText.stop) {
			this.onChangeText.stop();
		}
		if (this.getUsers && this.getUsers.stop) {
			this.getUsers.stop();
		}
		if (this.unsubscribeFocus){
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur){
			this.unsubscribeBlur();
		}
		if (isTablet) {
			EventEmitter.removeListener(KEY_COMMAND, this.handleCommands);
		}
	}

	UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
		const {isFocused, editing, replying, sharing, getCustomEmoji, setCurrentCustomEmoji} = this.props;
		if(!isFocused?.()){
			return;
		}
		if(sharing){
			this.setInput(nextProps.message.msg??'');
			return;
		}
		if(editing !== nextProps.editing && nextProps.editing){
			let editMessage = nextProps.message.msg;

			// Edit Custom Emoji
			let customEmoji = null;
			if ( editMessage.charAt(0) === ':') {
				const tMessage = editMessage.substring(1, editMessage.length);
				const lastIndex = tMessage.indexOf(':');
				const emojiContent = tMessage.substring(0, lastIndex);
				customEmoji = getCustomEmoji && getCustomEmoji(emojiContent);

				if(customEmoji){
					editMessage = tMessage.substring(lastIndex + 1, tMessage.length).trim();
					setCurrentCustomEmoji(`:${emojiContent}:`);
				}

			// Edit Reply Message
			}
			editMessage = filterRepliedMessage(editMessage);

			this.setInput(editMessage);
			if(this.text){
				this.setShowSend(true);
			}
			this.focus();
		} else if (replying !== nextProps.replying){
			this.focus();
		} else if (!nextProps.message){
			this.clearInput();
		}
	}

	onChangeText = (text) => {
		const isTextEmpty = text.length === 0;
		this.setShowSend(!isTextEmpty);
		this.debouncedOnChangeText(text);
	};

	onSelectionChange = (e) => {
		this.selection = e.nativeEvent.selection;
	}

	// eslint-disable-next-line react/sort-comp
	debouncedOnChangeText = debounce(async (text) => {
		this.setInput(text);

		const isTextEmpty = text.length === 0;
		// this.setShowSend(!isTextEmpty);
		this.handleTyping(!isTextEmpty);

		if (!isTextEmpty) {
			try {
				const { start, end } = this.selection;
				const cursor = Math.max(start, end);
				const lastNativeText = this.text;

				// TODO Allow Only User Mention (@)
				// matches if text either starts with '/' or have (@,#,:) then it groups whatever comes next of mention type
				let regexp = new XRegExp("(@)([\\w\\p{Hiragana}\\p{Katakana}\\p{Han}._-]*)$", "im")

				const result = lastNativeText.substr(0, cursor).match(regexp);
				console.log('mention', result, lastNativeText, cursor);
				if (!result) {
					return this.stopTrackingMention();
				}
				const [, lastChar, name] = result;
				this.identifyMentionKeyword(name, lastChar);
			} catch (e) {
				log(e);
			}
		} else {
			this.stopTrackingMention();
		}
	}, 100);

	onKeyboardResigned = () => {
		const { showEmojiKeyboard } = this.state;
		const { window } = this.props;
		if(isIOS){
			this.closeEmoji();
		} else if(!showEmojiKeyboard && window.width > window.height){
			this.closeEmoji();
		}
	};

	onPressMention = (item) => {
		if (!this.component) {
			return;
		}
		const msg = this.text;
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);

		const regexp = new XRegExp("([\\w\\p{Hiragana}\\p{Katakana}\\p{Han}._-]+)$", "im")

		const result = msg.substr(0, cursor)
			.replace(regexp, '');
		const mentionName = (item.username || item.name);
		const text = `${ result }${ mentionName } ${ msg.slice(cursor) }`;

		const newCursor = cursor + mentionName.length + 1;
		this.setInput(text, { start: newCursor, end: newCursor });
		this.focus();
		requestAnimationFrame(() => this.stopTrackingMention());
	};

	onEmojiSelected = async(keyboardId, params) => {
		const { setCurrentCustomEmoji, currentCustomEmoji } = this.props;
		const { text } = this;
		const { emoji } = params;
		let newText = '';

		if (emoji.charAt(0) === ':' && emoji.charAt(emoji.length - 1) === ':') {
			if (!currentCustomEmoji || currentCustomEmoji !== emoji) {
				setCurrentCustomEmoji(emoji);
				this.setShowSend(true);
			} else {
				await this.submit();
			}
			return;
		}

		// if messagebox has an active cursor
		const { start, end } = this.selection;
		const cursor = Math.max(start, end);
		newText = `${ text.substr(0, cursor) }${ emoji }${ text.substr(cursor) }`;
		const newCursor = cursor + emoji.length;
		this.setInput(newText, { start: newCursor, end: newCursor });
		this.setShowSend(true);
	};

	get leftButtons() {
		const { isFetching } = this.state;
		const { theme, editing, replying, sharing } = this.props;
		if (sharing || replying) {
			return null;
		}
		if (editing) {
			return <CancelEditingButton onPress={this.editCancel} theme={theme} />;
		}
		return (
			<BorderlessButton
				key='file-message'
				onPress={ isFetching ? null : this.showFileActions }
				style={ styles.actionButtons }
				testID='messagebox-actions'
				accessibilityLabel={ I18n.t('Message actions') }
				accessibilityTraits='button'
			>
				<Image style={ styles.actionButton } source={ { uri: 'icon_plus' } }/>
			</BorderlessButton>
		);
	}

	get rightButtons() {
		const { showEmojiKeyboard } = this.state;
		const { sharing, theme } = this.props;
		const icons = [];
		if (sharing) {
			return null;
		} else if (!showEmojiKeyboard) {
			icons.push(
				<BorderlessButton
					key='button'
					onPress={ this.openEmoji }
					accessibilityLabel={ I18n.t('Open_emoji_selector') }
					accessibilityTraits='button'
					style={ styles.modeButton }
					testID='messagebox-open-emoji'
				>
					<CustomIcon
						size={ 30 }
						color={ themes[theme].bodyText }
						name='emoji'
					/>
				</BorderlessButton>
			);
		} else {
			icons.push(
				<BorderlessButton
					key='input'
					onPress={ this.closeEmoji }
					accessibilityLabel={ I18n.t('Close_emoji_selector') }
					accessibilityTraits='button'
					style={ styles.modeButton }
					testID='messagebox-close-emoji'
				>
					<CustomIcon
						size={ 30 }
						color={ themes[theme].bodyText }
						name='keyboard'
					/>
				</BorderlessButton>
			);
		}
		return icons;
	}

	get submitButton() {
		const { showSend } = this.state;
		const { theme } = this.props;
		if (showSend) {
			return (
				<BorderlessButton
					key='send-message'
					onPress={ this.submit }
					style={ styles.sendButton }
					testID='messagebox-send-message'
					accessibilityLabel={ I18n.t('Send message') }
					accessibilityTraits='button'
				>
					<Text style={{ ...styles.sendText, color: themes[theme].bodyText, borderColor: themes[theme].borderColor }}>{ I18n.t("Send") }</Text>
				</BorderlessButton>
			);
		} else {
			return null;
		}
	}

	getPermalink = async(message, replyText) => {
		try {
			// Fix bug => Don`t show origin message text in Encrypted Room.
			return await RocketChat.getPermalinkMessage(message, replyText);
		} catch (error) {
			return null;
		}
	};

	getUsers = debounce(async(keyword) => {
		const { members } = this.props;

		let result = members.map(member => {
			return {_id: member._id, username: filterMentionName(member.username)};
		});
		if(keyword.length) {
			result = members.filter(user => user.username.match(new RegExp(keyword, 'i')))
		}
		result = result.slice(0, MENTIONS_COUNT_TO_DISPLAY).map(u => ({id: u._id, username: u.username}));

		this.setState({ mentions: result });
	}, 300);

	focus = () => {
		if (this.component && this.component.focus) {
			this.component.focus();
		}
	};

	handleTyping = (isTyping) => {
		const { typing, rid, cardName } = this.props;
		if (!isTyping) {
			if (this.typingTimeout) {
				clearTimeout(this.typingTimeout);
				this.typingTimeout = false;
			}
			typing(rid, cardName, false);
			return;
		}

		if (this.typingTimeout) {
			return;
		}

		this.typingTimeout = setTimeout(() => {
			typing(rid, cardName, true);
			this.typingTimeout = false;
		}, 1000);
	};

	setInput = (text, selection) => {
		this.text = text;
		if (selection) {
			return this.component.setTextAndSelection(text, selection);
		}
		this.component.setNativeProps({ text });
	};

	setShowSend = (showSend) => {
		const { showSend: prevShowSend } = this.state;
		if (prevShowSend !== showSend) {
			this.setState({ showSend });
		}
	};

	clearInput = () => {
		const { setCurrentCustomEmoji } = this.props;
		this.setInput('');
		setCurrentCustomEmoji(null);
		this.setShowSend(false);
	};

	sendMediaMessage = async({file, description, isArray}) => {
		const {
			rid, cardId, tmid, baseUrl: server, user, message: { id: messageTmid }, replyCancel
		} = this.props;
		this.setState({ file: { isVisible: false } });
		this.setState({ isFetching: true });

		let files = isArray?file:[file];

		let fileInfos = [];
		files.forEach((item) => {
			const file_description = item.thumbnail ? JSON.stringify({description: description, thumbnail: item.thumbnail}) : description;
			fileInfos.push({
				name: item.name || item.filename,
				description: file_description,
				size: item.size,
				type: item.mime,
				store: 'Uploads',
				path: item.path
			});
		});

		try {
			replyCancel();
			// Folder Structure
			const messageId = random(17);

			if(fileInfos.length){
				let iter = 0;
				const sendIterator = async () => {
					if(iter < fileInfos.length){
						await RocketChat.sendFileMessage(rid, cardId, messageId, fileInfos[iter], tmid || messageTmid, server, user);
						iter++;
						setTimeout(sendIterator, 100);
					}
				}

				await sendIterator();
			}

			//Review.pushPositiveEvent();
		} catch (e) {
			log(e, "sendMediaMessage Error:");
		}
		this.setState({ isFetching: false });
	};

	takePhoto = async() => {
		try {
			await ImagePicker.clean();
			const image = await ImagePicker.openCamera(this.imagePickerConfig);
			console.log('camera image', image);
			if(image && image.path){
				let image_path = image.path.replace('file://', '');
				PhotoEditor.Edit({ path: image_path, hiddenControls: PHOTO_EDITOR_HIDDEN_CONTROLS, onDone: async (path) => {
						if (this.canUploadFile(image)) {
							this.showUploadModal(image);
						} else {
							Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
						}
					}});
			}
		} catch (e) {
			log(e, 'takePhoto Error:');
		}
	};

	takeVideo = async() => {
		try {
			let video = await ImagePicker.openCamera(this.videoPickerConfig);

			await this.uploadFiles(video);
		} catch (e) {
			log(e);
			this.setState({ isCompressing: false });
		}
	};

	chooseFromLibrary = async() => {
		try {
			await ImagePicker.clean();
			let files = await ImagePicker.openPicker(this.libraryPickerConfig);

			await this.uploadFiles(files, true);
		} catch (e) {
			log(e, "Choose From Library Error: ");
			this.setState({ isCompressing: false});
		}
	};


	chooseFile = async() => {
		try {
			let res = await DocumentPicker.pickMultiple({
				type: [DocumentPicker.types.allFiles]
			});

			LOG_L_TOP('Choose Files: ', res);

			let files = [];
			res.forEach((res)=> {
				files.push({
					filename: res.name,
					size: res.size,
					mime: res.type,
					path: res.uri
				});
			});
			await this.uploadFiles(files, true);
		} catch (e) {
			if (!DocumentPicker.isCancel(e)) {
				log(e, " Choose File Error: ");
				this.setState({ isCompressing: false});
			}
		}
	};


	checkCompressMedia = async(files, isArray=false) => {
		const { rid, baseUrl, user, cardId } = this.props;

		let compress_files = files;
		if(!isArray){
			compress_files = [compress_files];
		}
		this.setState({ isCompressing: true });

		let compressed_files = await Promise.all(compress_files.map(async (file) => {
			let compressed_file = await compressMedia(file, rid, baseUrl, user, cardId);
			LOG_L_TOP('compressFile: ', compressed_file);
			return compressed_file;
		}));

		this.setState({ isCompressing: false });

		if(isArray){
			return compressed_files;
		}
		return compressed_files[0];
	};

	editImage = (image) => {
		if(image && image.path){
			let image_path = decodeURIComponent(image.path.replace('file://', ''));
			PhotoEditor.Edit({ path: image_path, hiddenControls: PHOTO_EDITOR_HIDDEN_CONTROLS, onDone: async (path) => {
					const data = await RNFetchBlob.fs.readFile(image_path, "base64");
					let editImage = {
						...image,
						data
					}
					if (this.canUploadFile(editImage, false)) {
						this.showUploadModal(editImage, false);
					}
				} });
		}
	}

	uploadFiles = async(files, isArray = false) => {
		let compressedFiles = await this.checkCompressMedia(files, isArray);

		if(compressedFiles.length === 1){
			let file = compressedFiles[0];

			//Image Edit
			if(/image/.test(file.mime)){
				return this.editImage(file);
			}
		}

		if (this.canUploadFile(compressedFiles, isArray)) {
			this.showUploadModal(compressedFiles, isArray);
		}
	}

	canUploadFile = (files, isArray = false) => {
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize } = this.props;

		let check_files = files;
		if(!isArray){
			check_files = [check_files];
		}
		check_files.forEach((file) => {
			const result = canUploadFile(file, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize);
			if (!result.success) {
				Alert.alert(I18n.t('Error_uploading'), I18n.t(result.error));
				return false;
			}
		});

		return true;
	}

	showUploadModal = (content, isArray = false) => {
		this.setState({
			file:{
				content,
				isArray,
				isVisible: true,
			}
		})
	};

	showFileActions = () => {
		const { showActionSheet } = this.props;
		this.closeKeyboard();
		showActionSheet({ options: this.options });
	};

	closeKeyboard = () =>{
		const { setShowingEmojiKeyboard } = this.props;
		setShowingEmojiKeyboard(false);
		this.setState({
			showEmojiKeyboard: false
		});
		Keyboard.dismiss();
	}

	editCancel = () => {
		const { editCancel } = this.props;
		editCancel();
		this.clearInput();
	};

	openEmoji = () => {
		const { setShowingEmojiKeyboard, window } = this.props;
		const { showEmojiKeyboard } = this.state;

		// setShowingEmojiKeyboard(true);
		// this.setState({
		// 	showEmojiKeyboard: true
		// });

		// todo fix bug - not showing EmojiKeyboard on landscape
		if(window.width > window.height && isAndroid && !showEmojiKeyboard){
			Keyboard.dismiss();
			setTimeout(() => {
				setShowingEmojiKeyboard(true);
				this.setState({
					showEmojiKeyboard: true
				});
			}, 10);
		} else {
			setShowingEmojiKeyboard(true);
			this.setState({
				showEmojiKeyboard: true
			});
		}
	};

	recordAudioMessage = async() => {
		this.setState({ recording:true });
	};


	recordingCallback = (recording) => {
		this.setState({ recording });
	}

	finishAudioMessage = async(fileInfo) => {
		const {
			rid, tmid, baseUrl: server, user, cardId
		} = this.props;

		if (fileInfo) {
			try {
				let audio = fileInfo;
				audio = await this.checkCompressMedia(audio);
				if (this.canUploadFile(audio)) {
					await RocketChat.sendFileMessage(rid, cardId, null, audio, tmid, server, user);
				}
			} catch (e) {
				if (e && e.error === 'error-file-too-large') {
					return Alert.alert(I18n.t(e.error));
				}
				log(e, 'Audio Error:');
			}
		}
	};

	closeEmoji = () => {
		const { showEmojiKeyboard } = this.state;
		const { setShowingEmojiKeyboard, setCurrentCustomEmoji, editing } = this.props;
		if(showEmojiKeyboard) {
			setShowingEmojiKeyboard(false);
			this.setState({
				showEmojiKeyboard: false,
			});
			if(!editing){
				setCurrentCustomEmoji(null);
			}
		}
	};

	submit = async() => {
		const {
			onSubmit, rid: roomId, tmid, currentCustomEmoji, sharing
		} = this.props;
		let message = this.text;

		// if sharing, only execute onSubmit prop
		if (sharing) {
			onSubmit(message);
			return;
		}

		this.clearInput();
		this.debouncedOnChangeText.stop();
		this.closeEmoji();
		this.stopTrackingMention();
		this.handleTyping(false);
		if (message.trim() === '' && !currentCustomEmoji) {
			return;
		}

		const {
			editing, replying, replyCancel
		} = this.props;

		if (currentCustomEmoji) {
			message = `${ currentCustomEmoji } ${ message }`.trim();
		}

		// Edit
		if (editing) {
			const { message: editingMessage, editRequest } = this.props;
			LOG_L_TOP('Edit Message', editing, editingMessage, message);
			const { id, cardId } = editingMessage;
			editRequest({
				id,
				msg: message,
				rid: editingMessage.subscription.id,
				cardId
			});

			// Reply
		} else if (replying) {
			const {
				message: replyingMessage, threadsEnabled, replyWithMention, replyText
			} = this.props;

			// Thread
			if (threadsEnabled && replyWithMention) {
				onSubmit(message, replyingMessage.id);

				// Legacy reply or quote (quote is a reply without mention)
			} else {
				// const { user, roomType } = this.props;
				const permalink = await this.getPermalink(replyingMessage, replyText);
				let msg = `[ ](${ permalink }) `;

				// if original message wasn't sent by current user and neither from a direct room
				// if (user.username !== replyingMessage.c.username && roomType !== 'd' && replyWithMention) {
				// 	msg += `@${ replyingMessage.c.username } `;
				// }

				msg = `${ msg } ${ message }`;
				onSubmit(msg);
			}

			replyCancel();

			// Normal message
		} else {
			onSubmit(message);
		}
	};

	updateMentions = (keyword, type) => {
		if (type === MENTIONS_TRACKING_TYPE_USERS) {
			this.getUsers(keyword);
		}
	};

	identifyMentionKeyword = (keyword, type) => {
		this.setState({
			showEmojiKeyboard: false,
			trackingType: type
		});
		const { setShowingEmojiKeyboard } = this.props;
		setShowingEmojiKeyboard(false);
		this.updateMentions(keyword, type);
	};

	stopTrackingMention = () => {
		const { trackingType } = this.state;
		if (!trackingType) {
			return;
		}
		this.setState({
			mentions: [],
			trackingType: '',
		});
	};

	handleCommands = ({ event }) => {
		if (handleCommandTyping(event)) {
			if (this.focused) {
				Keyboard.dismiss();
			} else {
				this.component.focus();
			}
			this.focused = !this.focused;
		} else if (handleCommandSubmit(event)) {
			this.submit();
		} else if (handleCommandShowUpload(event)) {
			this.showFileActions();
		}
	};

	onClosePreview = () => {
		const { setCurrentCustomEmoji } = this.props;
		setCurrentCustomEmoji(null);
		if(this.text.length === 0) {
			this.setShowSend(false);
		}
	};

	renderCustomEmojiPreview = () => {
		const { baseUrl, getCustomEmoji, currentCustomEmoji, window,  theme } = this.props;
		if (!currentCustomEmoji) {
			return null;
		}

		const is_horizontal = window.width > window.height;
		const parsedContent = currentCustomEmoji.replace(/^:|:$/g, '');
		const current_emoji = getCustomEmoji && getCustomEmoji(parsedContent);
		if (!current_emoji) {
			// todo don`t exist custom emoji => show notification
			return null;
		}

		return (
			<View style={ [styles.previewContainer, is_horizontal?{width:'115%'}:{width: '100%'}] }>
				<View style={ styles.previewCustomEmojiContainer }>
					<CustomEmoji
						key='mention-item-avatar'
						style={ styles.previewCustomEmoji }
						emoji={ current_emoji }
						baseUrl={ baseUrl }
					/>
				</View>
			</View>
		);
	};

	renderReplyPreview = () => {
		const {
			message, replying, replyText, replyCancel, getCustomEmoji, cardName, theme
		} = this.props;

		return <ReplyPreview
					key='reply-preview'
					message={ message }
					close={ replyCancel }
					username={ cardName }
					replying={replying}
					replyText={replyText}
					getCustomEmoji={getCustomEmoji}
					theme={theme}
				/>;
	};

	renderCompressing = () => {
		return (
			<View style={ styles.compressingContainer }>
				<RCActivityIndicator color='#777' size='large'/>
			</View>
		);
	};

	renderContent = () => {
		const {
			recording, mentions, trackingType,
		} = this.state;
		const {
			editing, currentCustomEmoji, children, theme
		} = this.props;

		const isAndroidTablet = isTablet && isAndroid ? {
			multiline: false,
			onSubmitEditing: this.submit,
			returnKeyType: 'send'
		} : {};

		if (recording) {
			return(
				<RecordAudio
					theme={theme}
					recordingCallback={this.recordingCallback}
					onFinish={this.finishAudioMessage}
				/>
			);
		}
		return (
			<SafeAreaView>
				<Mentions mentions={mentions} trackingType={trackingType} theme={theme} />
				<View style={[styles.composer, { borderTopColor: themes[theme].borderColor }]} key='messagebox'>
					{this.renderReplyPreview()}
					{ currentCustomEmoji ? this.renderCustomEmojiPreview() : null }
					<View
						style={ [styles.textArea,
							{ backgroundColor: themes[theme].messageboxBackground },
							!recording && editing && { backgroundColor: themes[theme].chatComponentBackground }
							] }
						testID='messagebox'
					>
						{ this.leftButtons }
						<View style={{ ...styles.textBoxInput, backgroundColor: themes[theme].auxiliaryBackground }}>
							<TextInput
								ref={component => this.component = component}
								style={styles.input}
								returnKeyType='default'
								keyboardType='twitter'
								blurOnSubmit={false}
								placeholder={I18n.t('New_Message')}
								placeholderTextColor={themes[theme].auxiliaryTintColor}
								onChangeText={this.onChangeText}
								onSelectionChange={this.onSelectionChange}
								underlineColorAndroid='transparent'
								defaultValue=''
								multiline
								testID='messagebox-input'
								disableFullscreenUI={true}
								{...isAndroidTablet}
								theme={theme}
							/>
							{this.rightButtons}
						</View>
						{this.submitButton}
					</View>
				</View>
				{children}
			</SafeAreaView>
		);
	};

	render() {
		const { showEmojiKeyboard, file, isFetching, isCompressing } = this.state;
		const { rid, cardId, user, baseUrl, iOSScrollBehavior, theme } = this.props;
		return (
			<MessageboxContext.Provider
				value={{
					user,
					baseUrl,
					onPressMention: this.onPressMention
				}}
			>
				<KeyboardAccessoryView
					ref={ref => this.tracking = ref}
					key='input'
					renderContent={ this.renderContent }
					kbInputRef={ this.component }
					kbComponent={ showEmojiKeyboard ? 'EmojiKeyboard' : null }
					onKeyboardResigned={ this.onKeyboardResigned }
					onItemSelected={ this.onEmojiSelected }
					//revealKeyboardInteractive
					requiresSameParentToManageScrollView
					addBottomView
					bottomViewColor={themes[theme].messageboxBackground}
					iOSScrollBehavior={iOSScrollBehavior}
				/>
				{ isCompressing ? this.renderCompressing() : null }
				<UploadModal
					key='upload-modal'
					rid={rid}
					cardId={cardId}
					baseUrl={baseUrl}
					user={user}
					isVisible={ (file && file.isVisible) }
					file={ file.content }
					isArray={ file.isArray }
					close={ () => this.setState({ file: {} }) }
					submit={ this.sendMediaMessage }
					isFetching={ isFetching }
				/>
			</MessageboxContext.Provider>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	isMasterDetail: state.app.isMasterDetail,
	threadsEnabled: state.settings.Threads_enabled,
	user: getUserSelector(state),
	userEmojis: state.login.user.emojis,
	FileUpload_MediaTypeWhiteList: state.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	currentCustomEmoji: state.room.currentCustomEmoji,
	customEmojis: state.customEmojis
});

const mapDispatchToProps = dispatch =>  ({
	typing: (rid, status) => dispatch(userTypingAction(rid, status)),
	setShowingEmojiKeyboard: (isShowing) => dispatch(setShowingEmojiKeyboardAction(isShowing)),
	setCurrentCustomEmoji: (emoji) => dispatch(setCurrentCustomEmojiAction(emoji))
});

export default connect(mapStateToProps, mapDispatchToProps, null, { forwardRef: true })(withActionSheet(MessageBox));

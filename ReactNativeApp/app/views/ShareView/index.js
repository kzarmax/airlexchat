import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, NativeModules} from 'react-native';
import {connect} from 'react-redux';
import ShareExtension from 'rn-extensions-share';
import * as VideoThumbnails from 'expo-video-thumbnails';

import SafeAreaView from '../../containers/SafeAreaView';
import {themes} from '../../constants/colors';
import I18n from '../../i18n';
import RocketChat from '../../lib/rocketchat';
import log from '../../utils/log';
import styles from './styles';
import TextInput from '../../containers/TextInput';
import * as HeaderButtom from '../../containers/HeaderButton';
import {isBlocked} from '../../utils/room';
import {withTheme} from '../../theme';
import ShareHeaderView from './Header';
import CustomHeaderView from '../RoomView/CustomHeader';
import Preview from "./Preview";
import StatusBar from "../../containers/StatusBar";
import Loading from "../../containers/Loading";
import MessageBox from "../../containers/MessageBox";
import Thumbs from "./Thumbs";
import {withDimensions} from "../../dimensions";
import {canUploadFile} from "../../utils/media";
import random from "../../utils/random";

class ShareView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string.isRequired,
			token: PropTypes.string.isRequired
		}),
		server: PropTypes.string,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		cards: PropTypes.array,
		width: PropTypes.number,
		height: PropTypes.number
	};

	constructor(props) {
		super(props);
		this.messagebox = React.createRef();
		this.files = props.route.params?.attachments ?? [];
		this.isShareExtension = true;
		const room = props.route.params?.room ?? {};
		this.card = props.cards.find(card => card._id === room.cardId);

		this.state = {
			loading: true,
			selected: {},
			isBlocked: false,
			attachments: [],
			text: props.route.params?.text ?? '',
			room,
			thread: props.route.params?.thread ?? {}
		};
		this.setHeader();
	}

	componentDidMount = async() => {
		const isBlocked = this.getBlocked();
		const { attachments, selected } = await this.getAttachments();
		this.setState({ isBlocked, attachments, selected, loading: false }, () => this.setHeader());
	}

	setHeader = () => {
		const { navigation, theme } = this.props;
		const { isBlocked, room, loading } = this.state;

		if( loading ){
			navigation.setOptions({
				title: I18n.t('Loading')
			})
			return;
		}
		navigation.setOptions({
			headerTitle: () => (
				<ShareHeaderView
					room={room}
					type={room.t}
					widthOffset={130}
					theme={theme}
				/>
			),
			headerRight: () =>
				!isBlocked ?
					<HeaderButtom.Container>
						<HeaderButtom.Item
							title={I18n.t('Send')}
							onPress={this.send}
							testID='send-message-share-view'
							buttonStyle={styles.send}
						/>
					</HeaderButtom.Container>
					: null
		});
	}

	getBlocked = () => {
		const { room } = this.state;
		return isBlocked(room);
	}

	getAttachments = async() => {
		const { room } = this.state;
		const { FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize, server, user } = this.props;
		const items = await Promise.all(this.files.map(async(item) => {
			// Check server settings
			const { success: canUpload, error } = canUploadFile(item, FileUpload_MediaTypeWhiteList, FileUpload_MaxFileSize);
			item.canUpload = canUpload;
			item.error = error;

			// get video thumbnails
			if (item.mime?.match?.(/video/)) {
				try{
					const thumbnail = await VideoThumbnails.getThumbnailAsync(item.path, { time: 100 });
					const response = await RocketChat.uploadFile(room.rid, room.cardId, thumbnail, server, user);
					if (response.success && response.id) {
						item.uri = thumbnail.uri;
						item.thumbnail = response.url;
					}
				} catch (err){
					log(err, 'Create Video Thumbnail Error:')
				}
			}

			// Set a filename, if there isn't any
			if (!item.filename) {
				item.filename = new Date().toISOString();
			}
			return item;
		}));
		return {
			attachments: items,
			selected: items[0]
		};
	}

	bytesToSize = bytes => `${ (bytes / 1048576).toFixed(2) }MB`;

	send = async() => {
		const { loading, selected } = this.state;
		if (loading) {
			return;
		}

		// update state
		this.selectFile(selected);

		const {
			attachments, room, text, thread
		} = this.state;
		const { navigation, server, user } = this.props;

		// if it's share extension this should show loading
		if (this.isShareExtension) {
			this.setState({ loading: true });

			// if it's not share extension this can close
		} else {
			navigation.pop();
		}

		try {
			// Send attachment
			if (attachments.length) {
				let iter = 0;
				const messageId = random(17);
				const sendIterator = async () => {
					if(iter < attachments.length){
						const { filename: name, mime: type, description, size, path, canUpload, thumbnail } = attachments[iter];
						if (canUpload) {
							const file_description = thumbnail ? JSON.stringify({description: description, thumbnail: thumbnail}) : description;
							await RocketChat.sendFileMessage(
								room.rid,
								room.cardId,
								messageId,
								{
									name,
									description: file_description,
									size,
									type,
									path,
									store: 'Uploads'
								},
								thread?.id,
								server,
								{ id: user.id, token: user.token }
							);
						}
						iter++;
						setTimeout(sendIterator, 100);
					}
				}

				await sendIterator();

				// Send text message
			} else if (text.length) {
				await RocketChat.sendMessage(room.rid, this.card, text, thread?.id, { id: user.id, token: user.token });
			}
		} catch (e) {
			console.log('send share error', e);
			// Do nothing
		}

		// if it's share extension this should close
		if (this.isShareExtension) {
			ShareExtension.close();
		}
	};

	selectFile = (item) => {
		const { attachments, selected } = this.state;
		if (attachments.length > 0) {
			const { text } = this.messagebox.current;
			const newAttachments = attachments.map((att) => {
				if (att.path === selected.path) {
					att.description = text;
				}
				return att;
			});
			return this.setState({ attachments: newAttachments, selected: item });
		}
	}

	removeFile = (item) => {
		const { selected, attachments } = this.state;
		let newSelected;
		if (item.path === selected.path) {
			const selectedIndex = attachments.findIndex(att => att.path === selected.path);
			// Selects the next one, if available
			if (attachments[selectedIndex + 1]?.path) {
				newSelected = attachments[selectedIndex + 1];
				// If it's the last thumb, selects the previous one
			} else {
				newSelected = attachments[selectedIndex - 1] || {};
			}
		}
		this.setState({ attachments: attachments.filter(att => att.path !== item.path), selected: newSelected ?? selected });
	}

	onChangeText = (text) => {
		this.setState({ text });
	}

	renderContent = () => {
		const {
			attachments, selected, room, text
		} = this.state;
		const { theme, navigation, width, height } = this.props;
		if (attachments.length) {
			return (
				<SafeAreaView style={styles.container}>
					<Preview
						// using key just to reset zoom/move after change selected
						key={selected?.path}
						item={selected}
						length={attachments.length}
						theme={theme}
						isShareExtension={this.isShareExtension}
					/>
					<MessageBox
						showSend
						sharing
						ref={this.messagebox}
						rid={room.rid}
						cardId={room.cardId}
						cardName={room.c?.username}
						roomType={room.t}
						theme={theme}
						onSubmit={this.send}
						message={{ msg: selected?.description ?? '' }}
						iOSScrollBehavior={NativeModules.KeyboardTrackingViewManager?.KeyboardTrackingScrollBehaviorNone}
						navigation={navigation}
						isFocused={navigation.isFocused}
						window={{width, height}}
					>
						<Thumbs
							attachments={attachments}
							theme={theme}
							isShareExtension={this.isShareExtension}
							onPress={this.selectFile}
							onRemove={this.removeFile}
						/>
					</MessageBox>
				</SafeAreaView>
			);
		}

		return (
			<TextInput
				containerStyle={styles.inputContainer}
				inputStyle={[
					styles.input,
					styles.textInput,
					{ backgroundColor: themes[theme].focusedBackground }
				]}
				placeholder=''
				onChangeText={this.onChangeText}
				defaultValue=''
				multiline
				textAlignVertical='top'
				autoFocus
				theme={theme}
				value={text}
			/>
		);
	};

	renderCustomHeader = () => {
		const { room } = this.state;
		const { theme } = this.props;

		return (
			<View style={{ ...styles.customHeaderContainer, backgroundColor: themes[theme].bannerBackground }} key='share-view-custom-header'>
				<CustomHeaderView
					roomIconId={room.o && room.o._id}
					roomUserId={room.o && room.o.userId}
					roomName={room.t === 'p' ? room.name : (room.o && room.o.username)}
					type={room.t}
					rid={room.rid}/>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		const {
			loading, isBlocked
		} = this.state;

		if (isBlocked) {
			return (
				<View style={[ styles.container, styles.centered, { backgroundColor: themes[theme].auxiliaryBackground}]}>
					<Text style={styles.title}>
						{ I18n.t('This_room_is_blocked') }
					</Text>
				</View>);
		}

		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: themes[theme].auxiliaryBackground }}>
				<StatusBar barStyle='light-content' backgroundColor={themes[theme].previewBackground} />
				{ this.renderCustomHeader() }
				{this.renderContent()}
				<Loading visible={loading} />
			</SafeAreaView>
		);
	}
}

const mapStateToProps = ((state) => ({
	FileUpload_MediaTypeWhiteList: state.share.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.share.settings.FileUpload_MaxFileSize,
	user: {
		id: state.share.user && state.share.user.id,
		token: state.share.user && state.share.user.token
	},
	server: state.share.server && state.share.server.server,
	cards: state.cards && state.cards.cards
}));

export default connect(mapStateToProps)(withDimensions(withTheme(ShareView)));

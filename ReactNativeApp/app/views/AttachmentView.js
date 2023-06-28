import React from 'react';
import {StyleSheet, View, PermissionsAndroid, TouchableOpacity, StatusBar, SafeAreaView} from 'react-native';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CameraRoll from '@react-native-community/cameraroll';
import * as mime from 'react-native-mime-types';
import RNFetchBlob from 'rn-fetch-blob';
import { Video } from 'expo-av';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { LISTENER } from '../containers/Toast';
import EventEmitter from '../utils/events';
import I18n from '../i18n';
import { withTheme } from '../theme';
import { ImageViewer } from '../presentation/ImageViewer';
import { themes } from '../constants/colors';
import { formatAttachmentUrl } from '../lib/utils';
import RCActivityIndicator from '../containers/ActivityIndicator';
import { isAndroid } from '../utils/deviceInfo';
import { getUserSelector } from '../selectors/login';
import { withDimensions } from '../dimensions';
import { getHeaderHeight } from '../containers/Header';
import {CustomIcon} from "../lib/Icons";
import {showToast} from "../utils/info";
import moment from "moment";

const styles = StyleSheet.create({
	container: {
		flex: 1,
        position: 'relative',
	},
	btnContainer: {
		position: 'absolute',
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
		padding: 24,
		color: 'white'
	}
});

class AttachmentView extends React.Component {
	static propTypes = {
		navigation: PropTypes.object,
		route: PropTypes.object,
		theme: PropTypes.string,
		baseUrl: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		insets: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			token: PropTypes.string
		}),
		Allow_Save_Media_to_Gallery: PropTypes.bool
	}

	constructor(props) {
		super(props);
		const attachment = props.route.params?.attachment;
		this.state = { attachment, loading: true };
	}

	componentDidMount() {
		const { navigation } = this.props;
		this.unsubscribeBlur = navigation.addListener('blur', () => {
			if (this.videoRef && this.videoRef.stopAsync) {
				this.videoRef.stopAsync();
			}
		});
	}

	componentWillUnmount() {
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	getVideoRef = ref => this.videoRef = ref;

	handleSave = async() => {
		const { attachment } = this.state;
		const { user, baseUrl } = this.props;
		const {
			image_url, image_type, video_url, video_type
		} = attachment;
		const url = image_url || video_url;
		const mediaAttachment = formatAttachmentUrl(url, user.id, user.token, baseUrl);

		if (isAndroid) {
			const rationale = {
				title: I18n.t('Write_External_Permission'),
				message: I18n.t('Write_External_Permission_Message')
			};
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, rationale);
			if (!(result || result === PermissionsAndroid.RESULTS.GRANTED)) {
				return;
			}
		}

		this.setState({ loading: true });
		try {
			const extension = image_url ? `.${ mime.extension(image_type) || 'jpg' }` : `.${ mime.extension(video_type) || 'mp4' }`;
			const documentDir = `${ RNFetchBlob.fs.dirs.DocumentDir }/`;
			const path = `${ documentDir + (video_url?'MOV_':'IMG_') + moment().format('YYYYMMDDhhmmss') + extension }`;
			const file = await RNFetchBlob.config({ path }).fetch('GET', mediaAttachment).then(res => res.path());
			await CameraRoll.save(file, { album: 'エアレペルソナ' });
			EventEmitter.emit(LISTENER, { message: I18n.t('saved_to_gallery') });
		} catch (e) {
			EventEmitter.emit(LISTENER, { message: I18n.t(image_url ? 'error-save-image' : 'error-save-video') });
		}
		this.setState({ loading: false });
	};

	onLoadError = (error) => {
		const { navigation } = this.props;
		this.setState({ loading: false });
		showToast('メディア閲覧中にエラーが発生しました。');
		navigation.pop();
	}

	renderImage = (uri) => {
		const {
			theme, width, height, insets
		} = this.props;
		const headerHeight = getHeaderHeight(width > height);
		return (
			<ImageViewer
				uri={uri}
				onLoadEnd={() => this.setState({ loading: false })}
				theme={theme}
				width={width}
				height={height - insets.top - insets.bottom - headerHeight}
			/>
		);
	}

	renderVideo = uri => (
		<Video
			source={{ uri }}
			rate={1.0}
			volume={1.0}
			isMuted={false}
			resizeMode={Video.RESIZE_MODE_CONTAIN}
			shouldPlay
			isLooping={false}
			style={styles.container}
			useNativeControls
			onLoad={() => this.setState({ loading: false })}
			onError={this.onLoadError}
			ref={this.getVideoRef}
		/>
	);

	render() {
		const { loading, attachment } = this.state;
		const { theme, user, baseUrl, navigation } = this.props;
		let content = null;

		if (attachment && attachment.image_url) {
			const uri = formatAttachmentUrl(attachment.image_url, user.id, user.token, baseUrl);
			content = this.renderImage(encodeURI(uri));
		} else if (attachment && attachment.video_url) {
			const uri = formatAttachmentUrl(attachment.video_url, user.id, user.token, baseUrl);
			content = this.renderVideo(encodeURI(uri));
		}

		return (
			<SafeAreaView style={[styles.container, { backgroundColor: 'black' }]}>
				<StatusBar hidden />
				{content}
				{loading ? <RCActivityIndicator absolute size='large' theme={theme} /> : null}
				<View style={styles.btnContainer}>
					<TouchableOpacity
						onPress={() => navigation.pop()}
					>
						<CustomIcon name='close' size={36} color={'white'}/>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={ this.handleSave }
					>
						<CustomIcon name='download' size={36} color={'white'}/>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	baseUrl: state.server.server,
	user: getUserSelector(state),
	Allow_Save_Media_to_Gallery: state.settings.Allow_Save_Media_to_Gallery ?? true
});

export default connect(mapStateToProps)(withTheme(withDimensions(withSafeAreaInsets(AttachmentView))));

import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';
import {connect} from 'react-redux';
import {Notifier} from 'react-native-notifier';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import Avatar from '../Avatar';
import {CustomIcon} from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import {themes} from '../../constants/colors';
import {useTheme} from '../../theme';
import {ROW_HEIGHT} from '../../presentation/RoomItem';
import {goRoom} from '../../utils/goRoom';
import {useOrientation} from '../../dimensions';
// import Video from "expo-av";
// import moment from "moment";
import I18n from "../../i18n";
import {LOG_L_MIDDLE} from "../../utils/log";
import RocketChat from "../../lib/rocketchat";


const AVATAR_SIZE = 48;
const BUTTON_HIT_SLOP = {
	top: 12, right: 12, bottom: 12, left: 12
};

const styles = StyleSheet.create({
	container: {
		height: ROW_HEIGHT,
		paddingHorizontal: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginHorizontal: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 4
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	inner: {
		flex: 1
	},
	avatar: {
		marginRight: 10
	},
	roomName: {
		fontSize: 17,
		lineHeight: 20,
		...sharedStyles.textMedium
	},
	message: {
		fontSize: 14,
		lineHeight: 17,
		...sharedStyles.textRegular
	},
	close: {
		marginLeft: 10
	},
	small: {
		width: '50%',
		alignSelf: 'center'
	},
	ring: {
		width: 0,
		height: 0,
	}
});

const NotifierComponent = React.memo(({
	notification, isMasterDetail, duration, customEmojis
}) => {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const { isLandscape } = useOrientation();
	const [ text, setText ] = useState('');
	// const [ pause, setPause ] = useState(true);

	const { text: message, payload, room, avatar } = notification;
	const { rid, type } = payload;
	// if sub is not on local database, title and avatar will be null, so we use payload from notification
	const { title = type === 'd' ? payload.sender.username : payload.name } = notification;

	const getCustomEmoji = (name) => {
		for(let pEmoji of customEmojis){
			if(pEmoji.name === name)
				return pEmoji;
			const childEmojis = Object.keys(pEmoji.children).map(key => pEmoji.children[key]);
			for(let childEmoji of childEmojis){
				if(childEmoji.name === name)
					return childEmoji;
			}
		}
		return null;
	};

	useEffect(() => {
		let text = message;
		if (payload.message && payload.message.t){
			if (payload.message.t === 'jitsi_call_started'){
				text = I18n.t('Voice_calling');
				// setPause(false);
			}
			else if(payload.message.t === 'jitsi_video_call_started'){
				text = I18n.t('Video_calling');
				// setPause(false);
			}
			else if(payload.message.t === 'gift_message'){
				text = I18n.t('Received_Gift');
			}
		}

		let msg = `${ text.replace(/[\n\t\r]/igm, '') }`;
		if ( msg.charAt(0) === ':' && msg.charAt(msg.length -1) === ':' ){
			const content = msg.slice( 1, -1 );
			const emojiExtension = getCustomEmoji(content);
			if (emojiExtension) {
				text = I18n.t('User_sent_a_custom_emoji');
			}
		}
		setText(text);
		// setTimeout(() => { setPause(true)}, duration);
	}, [payload, message, duration]);

	const onPress = () => {
		const { rid, message } = payload;
		if (!rid) {
			return;
		}

		// if (isMasterDetail) {
		// 	Navigation.navigate('DrawerNavigator');
		// }

		LOG_L_MIDDLE('Notification Go To Room:', room);
		goRoom({ item: room, isMasterDetail });
		hideNotification();

		if (message.t === 'jitsi_call_started' || message.t === 'jitsi_video_call_started') {
			RocketChat.callJitsi(rid, room.cardId, message.t === 'jitsi_call_started');
		}
	};

	const hideNotification = () => {
		// setPause(true);
		Notifier.hideNotification();
	}

	return (
		<View style={[
			styles.container,
			(isMasterDetail || isLandscape) && styles.small,
			{
				backgroundColor: themes[theme].focusedBackground,
				borderColor: themes[theme].separatorColor,
				marginTop: insets.top
			}
		]}
		>
			<Touchable
				style={styles.content}
				onPress={onPress}
				hitSlop={BUTTON_HIT_SLOP}
				background={Touchable.SelectableBackgroundBorderless()}
			>
				<>
					<Avatar text={avatar} size={AVATAR_SIZE} borderRadius={AVATAR_SIZE/2} type={type} rid={rid} style={styles.avatar} />
					<View style={styles.inner}>
						<Text style={[styles.roomName, { color: themes[theme].titleText }]} numberOfLines={1}>{title}</Text>
						<Text style={[styles.message, { color: themes[theme].titleText }]} numberOfLines={1}>{text}</Text>
					</View>
					{/*<View style={styles.ring}>*/}
					{/*	<Video*/}
					{/*		ref={this.setRef}*/}
					{/*		source={require('./ring.mp3')}*/}
					{/*		paused={pause}*/}
					{/*		repeat={true}*/}
					{/*	/>*/}
					{/*</View>*/}
				</>
			</Touchable>
			<Touchable
				onPress={hideNotification}
				hitSlop={BUTTON_HIT_SLOP}
				background={Touchable.SelectableBackgroundBorderless()}
			>
				<CustomIcon name='close' style={[styles.close, { color: themes[theme].titleText }]} size={20} />
			</Touchable>
		</View>
	);
});

NotifierComponent.propTypes = {
	notification: PropTypes.object,
	isMasterDetail: PropTypes.bool
};

const mapStateToProps = state => ({
	isMasterDetail: state.app.isMasterDetail,
	customEmojis: state.customEmojis
});

export default connect(mapStateToProps)(NotifierComponent);

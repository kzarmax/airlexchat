import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';
import FastImage from '@rocket.chat/react-native-fast-image';
import Touchable from 'react-native-platform-touchable';
import { settings as RocketChatSettings } from '@rocket.chat/sdk';

import { avatarURL } from '../../utils/avatar';
import Emoji from '../markdown/Emoji';
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {SERVER_ID} from "../../constants/messagesStatus";

const Avatar = React.memo(({
	text,
	size,
	server,
	borderRadius,
	style,
	avatar,
	type,
	children,
	user,
	onPress,
	emoji,
	backIcon,
	theme,
	getCustomEmoji,
	avatarETag,
	isStatic,
	rid,
	blockUnauthenticatedAccess
}) => {
	if ((!text && !avatar && !emoji && !rid && !backIcon) || !server) {
		return null;
	}

	const avatarStyle = {
		width: size,
		height: size,
		borderRadius
	};

	let image;
	if (emoji) {
		image = (
			<Emoji
				theme={theme}
				baseUrl={server}
				getCustomEmoji={getCustomEmoji}
				isMessageContainsOnlyEmoji
				literal={emoji}
				style={avatarStyle}
			/>
		);
	} else if(!text && !avatar && !emoji && !rid && backIcon){
		image = (
			<View style={{ alignItems: 'center', justifyContent: 'center', height: '100%'}}>
				<FontAwesome name={backIcon} size={size/2} color={'white'}/>
			</View>
		);
	} else {
		let uri = avatar;
		if (text === SERVER_ID) {
			image = (
				<FastImage
					style={{ ...avatarStyle }}
					source={require('../../static/images/airlex_chat.png')}
					/>
				);
		} else {
			if (!isStatic) {
				uri = avatarURL({
					type,
					text,
					size,
					user,
					avatar,
					server,
					avatarETag,
					rid,
					blockUnauthenticatedAccess
				});
			}

			image = (
				<FastImage
					style={avatarStyle}
					source={{
						uri,
						headers: RocketChatSettings.customHeaders,
						priority: FastImage.priority.high
					}}
				/>
			);
		}
	}

	if (onPress) {
		image = (
			<Touchable onPress={onPress}>
				{image}
			</Touchable>
		);
	}


	return (
		<View style={[avatarStyle, style]}>
			{image}
			{children}
		</View>
	);
});

Avatar.propTypes = {
	server: PropTypes.string,
	style: PropTypes.any,
	text: PropTypes.string,
	avatar: PropTypes.string,
	emoji: PropTypes.string,
	size: PropTypes.number,
	borderRadius: PropTypes.number,
	type: PropTypes.string,
	children: PropTypes.object,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	theme: PropTypes.string,
	onPress: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	avatarETag: PropTypes.string,
	isStatic: PropTypes.bool,
	rid: PropTypes.string,
	blockUnauthenticatedAccess: PropTypes.bool
};

Avatar.defaultProps = {
	text: '',
	size: 25,
	type: 'd',
	borderRadius: 4
};

export default Avatar;

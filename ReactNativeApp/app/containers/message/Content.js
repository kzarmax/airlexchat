import React, {useContext} from 'react';
import { Text, View } from 'react-native';
import PropTypes from 'prop-types';
import equal from 'deep-equal';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../markdown';
import {getInfoMessage} from './utils';
import { themes } from '../../constants/colors';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import MessageContext from "./Context";

const Content = React.memo((props) => {
	if (props.isInfo) {
		const infoMessage = getInfoMessage({ ...props });

		return (
			<Text
				style={[styles.textInfo, { color: props.textColor?props.textColor:themes[props.theme].auxiliaryText }]}
				accessibilityLabel={infoMessage}
			>
				{infoMessage}
			</Text>
		);
	}

	const {
		getCustomEmoji, msg, searchText, isOwn, theme
	} = props;

	const { baseUrl, card } = useContext(MessageContext);

	let msgText = msg;
	const isPreview = props.tmid && !props.isThreadRoom;
	let content = null;
	let customEmoji = null;

	 if ( msg.charAt(0) === ':') {
	 	 const tmsg = msg.substring(1, msg.length);
		 const lastIndex = tmsg.indexOf(':');
		 const emojiContent = tmsg.substring(0, lastIndex);
		 msgText = tmsg.substring(lastIndex + 1, tmsg.length).trim();
		 const emojiExtension = getCustomEmoji && getCustomEmoji(emojiContent);
		 const emoji = {
			 ...emojiExtension,
			 content : emojiContent
		 };

		 if (emojiExtension) {
			 customEmoji = (<CustomEmoji baseUrl={ baseUrl } style={ styles.customEmoji } emoji={ emoji }/>);
			 if(!msgText || msgText.length === 0){
			 	return customEmoji;
			 }
		 } else {
		 	msgText = emojiContent + msgText;
		 }
	 }

	if (props.tmid && !msgText) {
		content = <Text style={[styles.text, { color: isOwn?themes[theme].ownMsgText:themes[theme].otherMsgText }]}>{I18n.t('Sent_an_attachment')}</Text>;
	} else if(!msgText) {
		return null;
	} else {
		content = (
			<Markdown
				msg={ msgText }
				baseUrl={baseUrl}
				searchText={ searchText }
				getCustomEmoji={ props.getCustomEmoji }
				username={ card.username }
				isEdited={ props.isEdited }
				numberOfLines={ (props.tmid && !props.isThreadRoom) ? 1 : 0 }
				preview={ !!props.tmid && !props.isThreadRoom }
				channels={ props.channels }
				mentions={ props.mentions }
				navToRoomInfo={ props.navToRoomInfo }
				tmid={ props.tmid }
				theme={ theme }
				isOwn={ isOwn }
			/>
		);
	}

	if(customEmoji){
		return (
			<>
				{customEmoji}
				<View style={{ ...styles.messageInnerContent, backgroundColor: isOwn?themes[theme].messageOwnBackground:themes[theme].messageOtherBackground }}>
					{content}
				</View>
			</>
		);
	}

	if (props.isIgnored) {
		content = <Text style={[styles.textInfo, { color: themes[theme].auxiliaryText }]}>{I18n.t('Message_Ignored')}</Text>;
	}

	return (
		<View style={{ ...styles.messageInnerContent, backgroundColor: isOwn?themes[theme].messageOwnBackground:themes[theme].messageOtherBackground }}>
			{content}
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.isTemp !== nextProps.isTemp) {
		return false;
	}
	if (prevProps.msg !== nextProps.msg) {
		return false;
	}
	if (prevProps.type !== nextProps.type) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	if (prevProps.isEncrypted !== nextProps.isEncrypted) {
		return false;
	}
	if (prevProps.isIgnored !== nextProps.isIgnored) {
		return false;
	}
	if (!equal(prevProps.mentions, nextProps.mentions)) {
		return false;
	}
	if (!equal(prevProps.channels, nextProps.channels)) {
		return false;
	}
	return true;
});

Content.propTypes = {
	isTemp: PropTypes.bool,
	isInfo: PropTypes.bool,
	tmid: PropTypes.string,
	isThreadRoom: PropTypes.bool,
	msg: PropTypes.string,
	theme: PropTypes.string,
	isEdited: PropTypes.bool,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	getCustomEmoji: PropTypes.func,
	channels: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
	navToRoomInfo: PropTypes.func,
	useRealName: PropTypes.bool,
	isIgnored: PropTypes.bool,
	type: PropTypes.string
};
Content.displayName = 'MessageContent';

export default Content;

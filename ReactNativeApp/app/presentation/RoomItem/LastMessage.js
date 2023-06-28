import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

import I18n from '../../i18n';
import styles from './styles';
import Markdown from '../../containers/markdown';
import { themes } from '../../constants/colors';
import { E2E_MESSAGE_TYPE, E2E_STATUS } from '../../lib/encryption/constants';
import shortnameToUnicode from "../../utils/shortnameToUnicode";

const formatMsg = ({
	lastMessage, searchMessage, type, showLastMessage, username, useRealName, selected, testID
}) => {
	if(searchMessage !== undefined && searchMessage) {
		return searchMessage;
	}
	if (!showLastMessage || testID.indexOf('friends-list-view') === 0) {
		return '';
	}
	if (!lastMessage || !lastMessage.c || lastMessage.pinned) {
		return I18n.t('No_Message');
	}
	if (lastMessage.t === 'jitsi_call_started') {
		const { c } = lastMessage;
		return I18n.t('Started_call', { userBy: c.username });
	}

	const isLastMessageSentByMe = lastMessage.c._id === selected._id;

	const user = isLastMessageSentByMe ? I18n.t('You') : lastMessage.c.username;
	if (!lastMessage.msg && lastMessage.attachments && Object.keys(lastMessage.attachments).length) {
		if (lastMessage.attachments[0].image_type) {
			return I18n.t('User_sent_an_image', { user });
		} else if (lastMessage.attachments[0].audio_type) {
			return I18n.t('User_sent_an_audio', { user });
		} else if (lastMessage.attachments[0].video_type) {
			return I18n.t('User_sent_a_video', { user });
		} else {
			return I18n.t('User_sent_an_attachment', { user });
		}
	} else if(lastMessage.t === 'jitsi_call_started'){
		return I18n.t('Voice_call_By', { userBy: lastMessage.c.username });
	} else if(lastMessage.t === 'jitsi_video_call_started'){
		return I18n.t('Video_call_By', { userBy: lastMessage.c.username });
	} else if(lastMessage.t === 'gift_message'){
		if(isLastMessageSentByMe){
			return I18n.t('Sent_Gift');
		} else {
			return I18n.t('Received_Gift_By', { userBy: user });
		}
	} else if(!lastMessage.msg){
		return '';
	}

	// Encrypted message pending decrypt
	if (lastMessage.t === E2E_MESSAGE_TYPE && lastMessage.e2e !== E2E_STATUS.DONE) {
		lastMessage.msg = I18n.t('Encrypted_message');
	}

	let prefix = '';
	if (isLastMessageSentByMe) {
		prefix = I18n.t('You_colon');
	}	else if (type !== 'd') {
		const { c: { name } } = lastMessage;
		prefix = `${ useRealName ? name : lastMessage.c.username }: `;
	}

	// todo
	// let msg = `${ lastMessage.msg.replace(/[\n\t\r]/igm, '') }`;
	// if ( msg.charAt(0) === ':'){
	// 	const tMessage = msg.substring(1, msg.length);
	// 	const lastIndex = tMessage.indexOf(':');
	// 	if(lastIndex > 0){
	// 		msg = tMessage.replace(':', '');
	// 	}
	// }
	// //msg = emojify(msg, { output: 'unicode' });
	//
	// // filter quote message
	// msg = msg.replace(/^\[([\s]]*)\]\(([^)]*)\)\s/, '').trim();
	// msg = shortnameToUnicode(msg);

	return `${ prefix }${ lastMessage.msg }`;
};

const arePropsEqual = (oldProps, newProps) => _.isEqual(oldProps, newProps);

const LastMessage = React.memo(({
	lastMessage, searchMessage, type, showLastMessage, username, alert, useRealName, testID, selected, theme
}) => (
	<Markdown
		msg={formatMsg({
			lastMessage, searchMessage, type, showLastMessage, username, useRealName, testID, selected
		})}
		style={[styles.markdownText, { color: alert ? themes[theme].bodyText : themes[theme].auxiliaryText }]}
		customEmojis={false}
		useRealName={useRealName}
		numberOfLines={1}
		preview
		theme={theme}
	/>
), arePropsEqual);

LastMessage.propTypes = {
	theme: PropTypes.string,
	lastMessage: PropTypes.object,
	searchMessage: PropTypes.string,
	type: PropTypes.string,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	useRealName: PropTypes.bool,
	alert: PropTypes.bool,
	selected: PropTypes.object,
	testID: PropTypes.string
};

export default LastMessage;

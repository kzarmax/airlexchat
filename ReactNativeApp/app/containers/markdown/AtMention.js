import React from 'react';
import PropTypes from 'prop-types';
import { Text } from 'react-native';

import { themes } from '../../constants/colors';

import styles from './styles';
import { logEvent, events } from '../../utils/log';
import {filterMentionName} from "../../utils/mentions";

const AtMention = React.memo(({
	mention, mentions, username, navToRoomInfo, style = [], useRealName, isOwn, theme
}) => {
	let mentionStyle = {};

	// Remove Special Character From user name
	let parseUsername = filterMentionName(username);
	if (mention === parseUsername) {
		mentionStyle = {
			color: themes[theme].mentionMeColor
		};
	} else {
		mentionStyle = {
			color: themes[theme].mentionOtherColor
		};
	}

	const user = mentions?.find?.(m => m && (m.parseName === mention || m.username === mention));
	const handlePress = () => {
		logEvent(events.ROOM_MENTION_GO_USER_INFO);
		const navParam = {
			t: 'd',
			rid: user && user._id
		};
		navToRoomInfo(navParam);
	};

	if (user) {
		return (
			<Text
				style={[styles.mention, mentionStyle, ...style]}
				onPress={handlePress}
			>
				{useRealName && user.name ? user.name : user.username}
			</Text>
		);
	}

	return (
		<Text style={[styles.text, { color: isOwn?themes[theme].ownMsgText:themes[theme].otherMsgText }, ...style]}>
			{`@${ mention }`}
		</Text>
	);
});

AtMention.propTypes = {
	mention: PropTypes.string,
	username: PropTypes.string,
	navToRoomInfo: PropTypes.func,
	style: PropTypes.array,
	useRealName: PropTypes.bool,
	isOwn: PropTypes.bool,
	theme: PropTypes.string,
	mentions: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
};

export default AtMention;

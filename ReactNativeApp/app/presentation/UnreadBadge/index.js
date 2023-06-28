import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';

import sharedStyles from '../../views/Styles';
import { getUnreadStyle } from './getUnreadStyle';
import { withTheme } from '../../theme';

const styles = StyleSheet.create({
	unreadNumberContainerNormal: {
		position: 'absolute',
		top: 10,
		left: 40,
		borderColor: '#fff',
		borderWidth: 1,
		minWidth: 22,
		padding: 3,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadNumberContainerSmall: {
		borderRadius: 10.5,
		alignItems: 'center',
		justifyContent: 'center'
	},
	unreadText: {
		color: '#fff',
		overflow: 'hidden',
		fontSize: 12,
		letterSpacing: 0.56,
		...sharedStyles.textSemibold
	},
	textSmall: {
		fontSize: 10
	}
});

const UnreadBadge = React.memo(({
	theme, unread, userMentions, groupMentions, style, tunread, tunreadUser, tunreadGroup, small
}) => {
	if ((!unread || unread <= 0) && (!tunread?.length)) {
		return;
	}
	const { backgroundColor, color } = getUnreadStyle({
		theme, unread, userMentions, groupMentions, tunread, tunreadUser, tunreadGroup
	});

	if (!backgroundColor) {
		return null;
	}
	let text = unread || tunread?.length;
	if (small && text >= 100) {
		text = '+99';
	}
	if (!small && text >= 1000) {
		text = '+999';
	}
	text = text.toString();

	let minWidth = 21;
	if (small) {
		minWidth = 11 + text.length * 5;
	}

	return (
		<View
			style={[
				small ? styles.unreadNumberContainerSmall : styles.unreadNumberContainerNormal,
				{ minWidth },
				{ backgroundColor },
				style
			]}
		>
			<Text
				style={[
					styles.unreadText,
					small && styles.textSmall,
					{ color }
				]}
				numberOfLines={1}
			>{text}
			</Text>
		</View>
	);
});

UnreadBadge.propTypes = {
	theme: PropTypes.string,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	style: PropTypes.object,
	tunread: PropTypes.array,
	tunreadUser: PropTypes.array,
	tunreadGroup: PropTypes.array,
	small: PropTypes.bool
};

export default withTheme(UnreadBadge);

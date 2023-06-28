import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import moment from 'moment';

import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';

import MessageError from './MessageError';
import messageStyles from './styles';

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		marginBottom: 2
	},
	containerOwn: {
		marginBottom: 2
	},
	username: {
		maxWidth: 200,
		fontSize: 12,
		fontWeight: '300',
		lineHeight: 16
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2
	},
	alias: {
		fontSize: 14,
		color: '#9EA2A8',
		paddingLeft:6,
		lineHeight:16
	}
});

const User = React.memo(({
	isHeader, useRealName, isOwn, author, alias, ts, timeFormat,isInfoMessage, roomType, onReadsPress, hasError, textColor, theme, ...props
}) => {
	if (isHeader || hasError) {
		const username = (useRealName && author?.name) || author?.username;
		const time = moment(ts).format(timeFormat);
		// 自分と他人とでUI変える
		if (isInfoMessage) {
			return (
				<View style={styles.containerOwn}>
					<Text style={[messageStyles.time, { color: textColor ? textColor : themes[theme].auxiliaryText }]}>{time}</Text>
				</View>
			);
		} else if (isOwn) {
			if (roomType === 'd') {
				return (
					<View style={styles.containerOwn}>
						<Text style={[messageStyles.time, { color: textColor ? textColor : themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
				);
			} else {
				return (
					<TouchableWithoutFeedback onPress={onReadsPress}>
						<View style={styles.containerOwn}>
							<Text style={[messageStyles.time, { color: textColor ? textColor : themes[theme].auxiliaryText }]}>{time}</Text>
						</View>
					</TouchableWithoutFeedback>
				);
			}
		} else {
			return (

					<View style={styles.titleContainer}>
						<Text style={[styles.username, { color: textColor ? textColor : themes[theme].titleText }]} numberOfLines={1}>{username}</Text>
						<Text style={[messageStyles.time, { color: textColor ? textColor : themes[theme].auxiliaryText }]}>{time}</Text>
						{ hasError && <MessageError hasError={hasError} theme={theme} {...props} /> }
					</View>
			);
		}
	}
	return null;
});

User.propTypes = {
	isHeader: PropTypes.bool,
	hasError: PropTypes.bool,
	useRealName: PropTypes.bool,
	author: PropTypes.object,
	alias: PropTypes.string,
	ts: PropTypes.number,
	timeFormat: PropTypes.string,
	theme: PropTypes.string,
	isInfoMessage: PropTypes.bool,
	roomType: PropTypes.string,
	onReadsPress: PropTypes.func
};
User.displayName = 'MessageUser';

export default withTheme(User);

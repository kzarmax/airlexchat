import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import moment from 'moment';
import { connect } from 'react-redux';

import Markdown from '../markdown';
import { CustomIcon } from '../../lib/Icons';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingTop: 10,
		paddingBottom: 5
	},
	messageContainer: {
		flex: 1,
		marginHorizontal: 10,
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderRadius: 4
	},
	header: {
		flexDirection: 'row',
		alignItems: 'flex-end'
	},
	username: {
		fontSize: 16,
		...sharedStyles.textMedium
	},
	input: {
		textAlignVertical: 'center',
		fontSize: 15,
		padding: 4,
		borderRadius: 4,
		maxHeight: 80
	},
	time: {
		fontSize: 12,
		lineHeight: 16,
		marginLeft: 6,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	close: {
		marginRight: 10
	}
});

const ReplyPreview = React.memo(({
	message, Message_TimeFormat, baseUrl, username, replying, replyText, getCustomEmoji, close, theme
}) => {
	if (!replying) {
		return null;
	}

	const time = moment(message.ts).format(Message_TimeFormat);
	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: themes[theme].messageboxBackground }
			]}
		>
			<View style={[styles.messageContainer, { backgroundColor: themes[theme].chatComponentBackground }]}>
				<View style={styles.header}>
					<Text style={[styles.username, { color: themes[theme].tintColor }]}>{message.c.username}</Text>
					<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
				</View>
				<Markdown
					msg={replyText??message.msg}
					baseUrl={baseUrl}
					username={username}
					getCustomEmoji={getCustomEmoji}
					numberOfLines={1}
					preview
					style={[{ color: themes[theme].auxiliaryText }]}
					theme={theme}
				/>
			</View>
			<CustomIcon name='close' color={themes[theme].auxiliaryText} size={20} style={styles.close} onPress={close} />
		</View>
	);
}, (prevProps, nextProps) => prevProps.replying === nextProps.replying && prevProps.theme === nextProps.theme);

ReplyPreview.propTypes = {
	replying: PropTypes.bool,
	replyText: PropTypes.string,
	message: PropTypes.object.isRequired,
	Message_TimeFormat: PropTypes.string.isRequired,
	close: PropTypes.func.isRequired,
	baseUrl: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	getCustomEmoji: PropTypes.func,
	theme: PropTypes.string
};

const mapStateToProps = state => ({
	Message_TimeFormat: state.settings.Message_TimeFormat,
	baseUrl: state.server.server
});

export default connect(mapStateToProps)(ReplyPreview);

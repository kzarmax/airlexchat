import React, {useContext} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';
import Touchable from 'react-native-platform-touchable';
import { isEqual } from 'lodash';

import Markdown from '../markdown';
import openLink from '../../utils/openLink';
import sharedStyles from '../../views/Styles';
import { themes } from '../../constants/colors';
import { CustomIcon } from '../../lib/Icons';
import MessageContext from "./Context";
import ReplyDescriptionContainer from "./ReplyDescriptionContainer";
import Avatar from "../Avatar";
import {VectorIcon} from "../../presentation/VectorIcon";

const styles = StyleSheet.create({
	button: {
		flex: 1,
		marginBottom: 1,
		borderRadius: 4
	},
	attachmentContainer: {
		flex: 1,
		borderRadius: 4,
		padding: 6
	},
	authorContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 2
	},
	author: {
		maxWidth: 200,
		fontSize: 14,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		marginLeft: 10,
		...sharedStyles.textRegular,
		fontWeight: '300'
	},
	fieldsContainer: {
		flex: 1,
		flexWrap: 'wrap',
		flexDirection: 'row'
	},
	fieldContainer: {
		flexDirection: 'column',
		padding: 10
	},
	fieldTitle: {
		fontSize: 14,
		...sharedStyles.textSemibold
	},
	fieldValue: {
		fontSize: 14,
		...sharedStyles.textRegular
	},
	attachmentIcon: {
		backgroundColor: 'transparent',
		height: 22,
		width: 20,
		marginTop: -2,
		marginLeft: -2
	},
	file: {
		flexDirection: 'row',
		alignItems: 'center'
	}
});

const Title = React.memo(({ attachment, timeFormat, isOwn, theme }) => {
	if (!attachment.author_name) {
		return null;
	}
	// const time = attachment.ts ? moment(attachment.ts).format(timeFormat) : null;
	return (
		<View style={styles.authorContainer}>
			<VectorIcon type='FontAwesome5' name='quote-left' size={14} style={[styles.attachmentIcon, {color: isOwn?themes[theme].ownMsgText:themes[theme].otherMsgText }]} />
			{ attachment.author_id ?
				<Avatar
					text={attachment.author_id}
					borderRadius={10}
					size={20}
					type='ca'
					style={{ marginRight: 4 }}
				/>
				:
				null }
			<Text style={[styles.author, { color: isOwn?themes[theme].ownMsgText:themes[theme].otherMsgText }]} numberOfLines={1} ellipsizeMode={'tail'}>{attachment.author_name}</Text>
			{/* todo check style {time ? <Text style={[styles.time, { color: isOwn?themes[theme].ownBodyText:themes[theme].bodyText }]}>{ time }</Text> : null} */}
		</View>
	);
});


const Description = React.memo(({
	attachment, getCustomEmoji, theme, isOwn
}) => {
	const text = attachment.text || attachment.title;
	if (!text) {
		return null;
	}
	const { baseUrl, user } = useContext(MessageContext);

	if(attachment.type === 'file'){
		return (
			<View style={styles.file}>
				<CustomIcon name='attach' size={24} style={{ color: isOwn?themes[theme].ownMsgText:themes[theme].otherMsgText }} />
				<ReplyDescriptionContainer
					isOwn={isOwn}
					style={{ marginLeft: 20 }}
					theme={theme}
				>
					<Markdown
						msg={text}
						baseUrl={baseUrl}
						username={user.username}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
						isOwn={isOwn}
						style={[{ fontSize: 14, lineHeight: 16, color: isOwn ? themes[theme].ownAuxiliaryText: themes[theme].otherAuxiliaryText }]}
					/>
				</ReplyDescriptionContainer>
			</View>
		);
	}
	return (
		<ReplyDescriptionContainer
			isOwn={isOwn}
			style={{ marginLeft: 20 }}
			theme={theme}
			>
				<Markdown
					msg={text}
					baseUrl={baseUrl}
					username={user.username}
					getCustomEmoji={getCustomEmoji}
					theme={theme}
					isOwn={isOwn}
					style={[{ fontSize: 14, color: isOwn ? themes[theme].ownAuxiliaryText: themes[theme].otherAuxiliaryText }]}
				/>
		</ReplyDescriptionContainer>
	);
}, (prevProps, nextProps) => {
	if (prevProps.attachment.text !== nextProps.attachment.text) {
		return false;
	}
	if (prevProps.attachment.title !== nextProps.attachment.title) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

const Fields = React.memo(({ attachment, theme }) => {
	if (!attachment.fields) {
		return null;
	}
	return (
		<View style={styles.fieldsContainer}>
			{attachment.fields.map(field => (
				<View key={field.title} style={[styles.fieldContainer, { width: field.short ? '50%' : '100%' }]}>
					<Text style={[styles.fieldTitle, { color: themes[theme].bodyText }]}>{field.title}</Text>
					<Text style={[styles.fieldValue, { color: themes[theme].bodyText }]}>{field.value}</Text>
				</View>
			))}
		</View>
	);
}, (prevProps, nextProps) => isEqual(prevProps.attachment.fields, nextProps.attachment.fields) && prevProps.theme === nextProps.theme);

const Reply = React.memo(({
	attachment, timeFormat, isOwn, getCustomEmoji, textColor, theme
}) => {
	if (!attachment) {
		return null;
	}
	const { baseUrl, user } = useContext(MessageContext);

	const onPress = () => {
		let url = attachment.title_link || attachment.author_link;
		if (!url) {
			return;
		}
		if (attachment.type === 'file') {
			url = `${ baseUrl }${ url }?rc_uid=${ user.id }&rc_token=${ user.token }`;
		}
		openLink(url, theme);
	};

	return (
		<>
			<Touchable
				onPress={onPress}
				style={[
					styles.button,
					{
						backgroundColor: isOwn?themes[theme].messageOwnBackground: themes[theme].messageOtherBackground
					}
				]}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
			>
				<View style={styles.attachmentContainer}>
					<Title attachment={attachment} timeFormat={timeFormat} isOwn={isOwn} theme={theme} />
					<Description
						attachment={attachment}
						timeFormat={timeFormat}
						baseUrl={baseUrl}
						user={user}
						getCustomEmoji={getCustomEmoji}
						theme={theme}
						isOwn={isOwn}
					/>
					<Fields attachment={attachment} theme={theme} />
				</View>
			</Touchable>
			<Markdown
				msg={attachment.description}
				baseUrl={baseUrl}
				username={user.username}
				getCustomEmoji={getCustomEmoji}
				isOwn={ isOwn }
				theme={theme}
				style={[{ color: textColor ? textColor: themes[theme].readText }]}
			/>
		</>
	);
}, (prevProps, nextProps) => isEqual(prevProps.attachment, nextProps.attachment) && prevProps.theme === nextProps.theme);

Reply.propTypes = {
	attachment: PropTypes.object,
	timeFormat: PropTypes.string,
	isOwn: PropTypes.bool,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	textColor: PropTypes.string
};
Reply.displayName = 'MessageReply';

Title.propTypes = {
	attachment: PropTypes.object,
	timeFormat: PropTypes.string,
	isOwn: PropTypes.bool,
	theme: PropTypes.string
};
Title.displayName = 'MessageReplyTitle';

Description.propTypes = {
	attachment: PropTypes.object,
	getCustomEmoji: PropTypes.func,
	isOwn: PropTypes.bool,
	theme: PropTypes.string
};
Description.displayName = 'MessageReplyDescription';

Fields.propTypes = {
	attachment: PropTypes.object,
	theme: PropTypes.string
};
Fields.displayName = 'MessageReplyFields';

export default Reply;

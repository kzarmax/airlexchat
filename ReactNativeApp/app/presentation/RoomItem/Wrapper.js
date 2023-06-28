import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from '../../containers/Avatar';
import UnreadBadge from "../UnreadBadge";
import TypeIcon from "./TypeIcon";
import CardInfo from "./CardInfo";

const Wrapper = ({
	accessibilityLabel,
	avatar,
	avatarSize,
	type,
	theme,
	rid,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	prid,
	status,
	showStatus,
	isGroupChat,
	selectAll,
	myCardId,
	myCardName,
	children
}) => (
	<View
		style={styles.container}
		accessibilityLabel={accessibilityLabel}
	>
		<Avatar
			text={avatar}
			size={avatarSize}
			type={type === 'p'?'p':'ca'}
			style={styles.avatar}
			borderRadius={25}
			rid={rid}
		/>
		{
			showStatus?
				<TypeIcon
					type={type}
					prid={prid}
					status={status}
					isGroupChat={isGroupChat}
					theme={theme}
				/>
				: null
		}
		<UnreadBadge
			unread={unread}
			userMentions={userMentions}
			groupMentions={groupMentions}
			tunread={tunread}
			tunreadUser={tunreadUser}
			tunreadGroup={tunreadGroup}
		/>
		<View
			style={[
				styles.centerContainer,
				{
					borderColor: themes[theme].separatorColor
				}
			]}
		>
			{children}
		</View>
		{
			selectAll?
				<CardInfo
					myCardId={myCardId}
					myCardName={myCardName}
					theme={theme}
				/>: null
		}
	</View>
);

Wrapper.propTypes = {
	accessibilityLabel: PropTypes.string,
	avatar: PropTypes.string,
	avatarSize: PropTypes.number,
	type: PropTypes.string,
	theme: PropTypes.string,
	rid: PropTypes.string,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	tunread: PropTypes.array,
	tunreadUser: PropTypes.array,
	tunreadGroup: PropTypes.array,
	status: PropTypes.string,
	prid: PropTypes.string,
	isGroupChat: PropTypes.bool,
	selectAll: PropTypes.bool,
	myCardId: PropTypes.string,
	myCardName: PropTypes.string,
	children: PropTypes.element
};

export default Wrapper;

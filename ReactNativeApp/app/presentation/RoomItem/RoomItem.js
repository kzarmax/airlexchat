import React from 'react';
import PropTypes from 'prop-types';
import { View } from 'react-native';

import styles from './styles';
import Wrapper from './Wrapper';
import LastMessage from './LastMessage';
import Title from './Title';
import UpdatedAt from './UpdatedAt';
import Touchable from './Touchable';

const RoomItem = ({
	rid,
	myCardId,
	myCardName,
	type,
	prid,
	name,
	avatar,
	width,
	avatarSize,
	username,
	showLastMessage,
	showStatus,
	status,
	useRealName,
	theme,
	isFocused,
	isGroupChat,
	notifications,
	blocker,
	date,
	accessibilityLabel,
	favorite,
	lastMessage,
	searchMessage,
	alert,
	hideUnreadStatus,
	unread,
	userMentions,
	groupMentions,
	tunread,
	tunreadUser,
	tunreadGroup,
	testID,
	swipeEnabled,
	onPress,
	toggleFav,
	toggleNotify,
	toggleBlock,
	selectAll,
	selected
}) => (
	<Touchable
		onPress={onPress}
		width={width}
		favorite={favorite}
		toggleFav={toggleFav}
		notifications={notifications}
		rid={rid}
		myCardId={myCardId}
		toggleNotify={toggleNotify}
		toggleBlock={toggleBlock}
		testID={testID}
		blocker={blocker}
		theme={theme}
		isFocused={isFocused}
		swipeEnabled={swipeEnabled}
	>
		<Wrapper
			accessibilityLabel={accessibilityLabel}
			avatar={avatar}
			avatarSize={avatarSize}
			type={type}
			theme={theme}
			rid={rid}
			unread={unread}
			userMentions={userMentions}
			groupMentions={groupMentions}
			tunread={tunread}
			tunreadUser={tunreadUser}
			tunreadGroup={tunreadGroup}
			status={status}
			showStatus={showStatus}
			isGroupChat={isGroupChat}
			selectAll={selectAll}
			myCardId={myCardId}
			myCardName={myCardName}
			prid={prid}
		>
			{showLastMessage
				? (
					<>
						<View style={styles.titleContainer}>
							<Title
								name={name}
								theme={theme}
								date={date}
								hideUnreadStatus={hideUnreadStatus}
								alert={alert}
							/>
							<UpdatedAt
								date={date}
								theme={theme}
								hideUnreadStatus={hideUnreadStatus}
								alert={alert}
								testID={testID}
							/>
						</View>
						<View style={styles.row}>
							<LastMessage
								lastMessage={lastMessage}
								searchMessage={searchMessage}
								type={type}
								showLastMessage={showLastMessage}
								username={username}
								alert={alert && !hideUnreadStatus}
								useRealName={useRealName}
								testID={testID}
								selected={selected}
								theme={theme}
							/>
						</View>
					</>
				)
				: (
					<View style={[styles.titleContainer, styles.flex]}>
						<Title
							name={name}
							theme={theme}
							hideUnreadStatus={hideUnreadStatus}
							alert={alert}
						/>
					</View>
				)
			}
		</Wrapper>
	</Touchable>
);

RoomItem.propTypes = {
	rid: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	myCardId: PropTypes.string,
	myCardName: PropTypes.string,
	prid: PropTypes.string,
	name: PropTypes.string.isRequired,
	avatar: PropTypes.string.isRequired,
	showLastMessage: PropTypes.bool,
	username: PropTypes.string,
	avatarSize: PropTypes.number,
	testID: PropTypes.string,
	width: PropTypes.number,
	status: PropTypes.string,
	useRealName: PropTypes.bool,
	theme: PropTypes.string,
	isFocused: PropTypes.bool,
	isGroupChat: PropTypes.bool,
	notifications: PropTypes.bool,
	blocker: PropTypes.bool,
	date: PropTypes.string,
	accessibilityLabel: PropTypes.string,
	lastMessage: PropTypes.object,
	searchMessage: PropTypes.string,
	favorite: PropTypes.bool,
	alert: PropTypes.bool,
	hideUnreadStatus: PropTypes.bool,
	unread: PropTypes.number,
	userMentions: PropTypes.number,
	groupMentions: PropTypes.number,
	tunread: PropTypes.array,
	tunreadUser: PropTypes.array,
	tunreadGroup: PropTypes.array,
	selectAll: PropTypes.bool,
	selected: PropTypes.object,
	swipeEnabled: PropTypes.bool,
	toggleFav: PropTypes.func,
	toggleNotify: PropTypes.func,
	onPress: PropTypes.func,
	toggleBlock: PropTypes.func
};

RoomItem.defaultProps = {
	avatarSize: 50,
	status: 'offline',
	swipeEnabled: true
};

export default RoomItem;

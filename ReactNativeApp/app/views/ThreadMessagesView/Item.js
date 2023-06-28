import React from 'react';
import PropTypes from 'prop-types';
import { View, Text, StyleSheet } from 'react-native';
import Touchable from 'react-native-platform-touchable';

import { withTheme } from '../../theme';
import Avatar from '../../containers/Avatar';
import sharedStyles from '../Styles';
import { themes } from '../../constants/colors';
import Markdown from '../../containers/markdown';
import { formatDateThreads, makeThreadName } from '../../utils/room';
import ThreadDetails from '../../containers/ThreadDetails';

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		padding: 16
	},
	contentContainer: {
		flexDirection: 'column',
		flex: 1
	},
	titleContainer: {
		flexDirection: 'row',
		marginBottom: 2,
		alignItems: 'center'
	},
	title: {
		flexShrink: 1,
		fontSize: 18,
		...sharedStyles.textMedium
	},
	time: {
		fontSize: 12,
		marginLeft: 8,
		...sharedStyles.textRegular
	},
	avatar: {
		marginRight: 8
	},
	threadDetails: {
		marginTop: 8
	},
	badge: {
		width: 12,
		height: 12,
		borderRadius: 6,
		marginHorizontal: 8,
		alignSelf: 'center'
	},
	messageContainer: {
		flexDirection: 'row'
	},
	markdown: {
		flex: 1
	}
});

const Item = ({
	item, baseUrl, theme, useRealName, cardId, badgeColor, onPress, toggleFollowThread
}) => {
	const username = item?.c?.username;
	let time;
	if (item?.ts) {
		time = formatDateThreads(item.ts);
	}

	return (
		<Touchable onPress={() => onPress(item)} testID={`thread-messages-view-${ item.msg }`} style={{ backgroundColor: themes[theme].backgroundColor }}>
			<View style={styles.container}>
				<Avatar
					style={styles.avatar}
					text={item?.c?._id}
					size={44}
					type={'ca'}
					borderRadius={22}
				/>
				<View style={styles.contentContainer}>
					<View style={styles.titleContainer}>
						<Text style={[styles.title, { color: themes[theme].titleText }]} numberOfLines={1}>{username}</Text>
						<Text style={[styles.time, { color: themes[theme].auxiliaryText }]}>{time}</Text>
					</View>
					<View style={styles.messageContainer}>
						<Markdown msg={makeThreadName(item)} baseUrl={baseUrl} username={username} theme={theme} numberOfLines={2} style={[styles.markdown, { color: themes[theme].auxiliaryText }]} preview />
					</View>
					<ThreadDetails
						item={item}
						cardId={cardId}
						badgeColor={badgeColor}
						toggleFollowThread={toggleFollowThread}
						style={styles.threadDetails}
					/>
				</View>
			</View>
		</Touchable>
	);
};

Item.propTypes = {
	item: PropTypes.object,
	baseUrl: PropTypes.string,
	theme: PropTypes.string,
	useRealName: PropTypes.bool,
	cardId: PropTypes.string,
	badgeColor: PropTypes.string,
	onPress: PropTypes.func,
	toggleFollowThread: PropTypes.func
};

export default withTheme(Item);

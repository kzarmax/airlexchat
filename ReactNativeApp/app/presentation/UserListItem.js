import React from 'react';
import {
	Text, View, StyleSheet, ViewPropTypes
} from 'react-native';
import PropTypes from 'prop-types';

import Avatar from '../containers/Avatar';
import Touch from '../utils/touch';
import { CustomIcon } from '../lib/Icons';

const styles = StyleSheet.create({
	button: {
		height: 54,
		backgroundColor: '#fff'
	},
	container: {
		flexDirection: 'row'
	},
	avatar: {
		marginHorizontal: 15,
		marginVertical: 12
	},
	textContainer: {
		// flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1
	},
	username: {
		fontSize: 18,
		color: '#0C0D0F',
		// marginTop: isIOS ? 6 : 3,
		textAlign: 'left'
	},
	icon: {
		marginHorizontal: 15,
		alignSelf: 'center',
		color: '#1D74F5'
	}
});

const UserListItem = ({
	cardId, username, onPress, testID, onLongPress, style, icon, theme
}) => (
	<Touch onPress={onPress} onLongPress={onLongPress} style={styles.button} testID={testID} theme={theme}>
		<View style={[styles.container, style]}>
			<Avatar text={cardId} size={30} type='ca' style={styles.avatar}/>
			<View style={styles.textContainer}>
				<Text style={styles.username}>{username}</Text>
			</View>
			{icon ? <CustomIcon name={icon} size={22} style={styles.icon} /> : null}
		</View>
	</Touch>
);

UserListItem.propTypes = {
	cardId: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	user: PropTypes.shape({
		id: PropTypes.string,
		token: PropTypes.string
	}),
	baseUrl: PropTypes.string.isRequired,
	onPress: PropTypes.func.isRequired,
	testID: PropTypes.string.isRequired,
	onLongPress: PropTypes.func,
	style: ViewPropTypes.style,
	icon: PropTypes.string,
	theme: PropTypes.string
};

export default UserListItem;

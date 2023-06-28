import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity } from 'react-native';

import Avatar from '../Avatar';
import styles from './styles';
import MessageContext from "./Context";

const MessageAvatar = React.memo(({
	isHeader, avatar, author, isOwn, small, navToRoomInfo
}) => {
	const { card } = useContext(MessageContext);

	if (isHeader) {
		const navParam = {
			cardId: card._id,
			isOwner: isOwn
		};
		return (
			<TouchableOpacity
				onPress={() => navToRoomInfo(navParam)}
				disabled={isOwn}
			>
				<Avatar
					style={small ? styles.avatarSmall : styles.avatar}
					type='ca'
					text={avatar ? '' : author?._id}
					size={small ? 32 : 44}
					borderRadius={small ? 16 : 22}
					avatar={avatar}
				/>
			</TouchableOpacity>
		);
	}
	return null;
});

MessageAvatar.propTypes = {
	isHeader: PropTypes.bool,
	avatar: PropTypes.string,
	author: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	card: PropTypes.object,
	small: PropTypes.bool,
	navToRoomInfo: PropTypes.func,
	updateAt: PropTypes.string
};
MessageAvatar.displayName = 'MessageAvatar';

export default MessageAvatar;

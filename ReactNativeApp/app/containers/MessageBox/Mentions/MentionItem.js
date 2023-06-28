import React, { useContext } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import PropTypes from 'prop-types';

import styles from '../styles';
import Avatar from '../../Avatar';
import MessageboxContext from '../Context';
import FixedMentionItem from './FixedMentionItem';
import { themes } from '../../../constants/colors';

const MentionItem = ({
	item, trackingType, theme
}) => {
	const context = useContext(MessageboxContext);
	const { onPressMention } = context;

	const defineTestID = (type) => {
		return `mention-item-${ item.username || item.name || item }`;
	};

	const testID = defineTestID(trackingType);

	let content = (
		<>
			<Avatar
				style={styles.avatar}
				text={item.id}
				size={30}
				type='ca'
			/>
			<Text style={[styles.mentionText, { color: themes[theme].titleText }]}>{ item.username || item.name || item }</Text>
		</>
	);

	return (
		<TouchableOpacity
			style={[
				styles.mentionItem,
				{
					backgroundColor: themes[theme].auxiliaryBackground,
					borderTopColor: themes[theme].separatorColor
				}
			]}
			onPress={() => onPressMention(item)}
			testID={testID}
		>
			{content}
		</TouchableOpacity>
	);
};

MentionItem.propTypes = {
	item: PropTypes.object,
	trackingType: PropTypes.string,
	theme: PropTypes.string
};

export default MentionItem;

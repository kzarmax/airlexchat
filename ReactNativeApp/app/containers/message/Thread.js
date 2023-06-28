import React, {useContext} from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { formatMessageCount } from './utils';
import styles from './styles';
import { CustomIcon } from '../../lib/Icons';
import { THREAD } from './constants';
import { themes } from '../../constants/colors';
import MessageContext from "./Context";
import {formatDateThreads} from "../../utils/room";

const Thread = React.memo(({
	msg, tcount, tlm, isThreadRoom, theme, isOwn, id, textColor
}) => {
	if (!tlm || isThreadRoom || tcount === 0) {
		return null;
	}

	const {
		threadBadgeColor
	} = useContext(MessageContext);

	const time = formatDateThreads(tlm);
	const buttonText = formatMessageCount(tcount, THREAD);

	return (
		<View style={styles.buttonContainer}>
			{
				isOwn?
					[
						threadBadgeColor ? <View style={[styles.threadBadge, { backgroundColor: threadBadgeColor }]} /> : null,
						<Text style={[styles.time, { color: textColor?textColor:themes[theme].auxiliaryText }]}>{time}</Text>,
						<View
							style={[styles.button, { backgroundColor: threadBadgeColor?threadBadgeColor:'#6C727A' }]}
							testID={`message-thread-button-${ msg }`}
						>
							<CustomIcon name='threads' size={18} style={[styles.buttonIcon, { color: themes[theme].buttonText }]} />
							<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{buttonText}</Text>
						</View>
					]
				:
					[
						<View
							style={[styles.button, { backgroundColor: threadBadgeColor?threadBadgeColor:'#6C727A' }]}
							testID={`message-thread-button-${ msg }`}
						>
							<CustomIcon name='threads' size={18} style={[styles.buttonIcon, { color: themes[theme].buttonText }]} />
							<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{buttonText}</Text>
						</View>,
						<Text style={[styles.time, { color: textColor?textColor:themes[theme].auxiliaryText }]}>{time}</Text>,
						threadBadgeColor ? <View style={[styles.threadBadge, { backgroundColor: threadBadgeColor }]} /> : null
					]

			}
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.tcount !== nextProps.tcount) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

Thread.propTypes = {
	msg: PropTypes.string,
	tcount: PropTypes.string,
	theme: PropTypes.string,
	tlm: PropTypes.string,
	isOwn: PropTypes.bool,
	isThreadRoom: PropTypes.bool,
	id: PropTypes.string,
	textColor: PropTypes.string
};
Thread.displayName = 'MessageThread';

export default Thread;

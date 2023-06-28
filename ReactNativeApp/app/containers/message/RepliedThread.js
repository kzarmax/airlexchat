import React from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';

import { CustomIcon } from '../../lib/Icons';
import styles from './styles';
import { themes } from '../../constants/colors';
import Markdown from '../markdown';

const RepliedThread = React.memo(({
	  tmid, tmsg, isHeader, fetchThreadName, id, isOwn, textColor, theme
  }) => {
	if (!tmid || !isHeader) {
		return null;
	}

	if (!tmsg) {
		fetchThreadName(tmid, id);
		return null;
	}

	let msg = tmsg;

	return (
		<View style={isOwn?styles.ownRepliedThread:styles.otherRepliedThread} testID={`message-thread-replied-on-${ msg }`}>
			<CustomIcon name='threads' size={20} style={styles.repliedThreadIcon} color={textColor?textColor:themes[theme].auxiliaryText} />
			<Markdown
				msg={msg}
				theme={theme}
				style={[styles.repliedThreadName, { fontSize: 14, color: textColor?textColor:themes[theme].auxiliaryText }]}
				preview
				numberOfLines={1}
			/>
			<View style={styles.repliedThreadDisclosure}>
				<CustomIcon
					name='chevron-right'
					color={textColor?textColor:themes[theme].auxiliaryText}
					size={20}
				/>
			</View>
		</View>
	);
}, (prevProps, nextProps) => {
	if (prevProps.tmid !== nextProps.tmid) {
		return false;
	}
	if (prevProps.tmsg !== nextProps.tmsg) {
		return false;
	}
	if (prevProps.isEncrypted !== nextProps.isEncrypted) {
		return false;
	}
	if (prevProps.isHeader !== nextProps.isHeader) {
		return false;
	}
	if (prevProps.theme !== nextProps.theme) {
		return false;
	}
	return true;
});

RepliedThread.propTypes = {
	tmid: PropTypes.string,
	tmsg: PropTypes.string,
	id: PropTypes.string,
	isHeader: PropTypes.bool,
	theme: PropTypes.string,
	fetchThreadName: PropTypes.func,
	isOwn: PropTypes.bool,
	textColor: PropTypes.string
};
RepliedThread.displayName = 'MessageRepliedThread';

export default RepliedThread;

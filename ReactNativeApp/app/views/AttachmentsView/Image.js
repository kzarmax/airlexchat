import React from 'react';
import PropTypes from 'prop-types';
import FastImage from '@rocket.chat/react-native-fast-image';
import equal from 'deep-equal';
import Image from 'react-native-image-progress';
import ProgressBar from 'react-native-progress/Bar';

import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';

export const MessageImage = React.memo(({ img, theme }) => (
	<Image
		style={[styles.image]}
		key={encodeURI(img)}
		source={{ uri: encodeURI(img) }}
		resizeMode={FastImage.resizeMode.contain}
		indicator={ProgressBar}
		indicatorProps={{
			color: themes[theme].actionTintColor,
			style: styles.imageIndicator
		}}
	/>
));

const ImageContainer = React.memo(({
	file, imageUrl, baseUrl, user, theme,
}) => {
	const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	return (
		<MessageImage img={img} theme={theme}/>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	rid: PropTypes.string,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageImageContainer';

MessageImage.propTypes = {
	img: PropTypes.string,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

export default ImageContainer;

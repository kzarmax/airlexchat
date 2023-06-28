import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import FastImage from '@rocket.chat/react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';
import Image from 'react-native-image-progress';
import ProgressBar from 'react-native-progress/Bar';

import Markdown from '../markdown';
import styles from './styles';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import MessageContext from "./Context";
import {View} from "react-native";

const Button = React.memo(({
	children, onPress, onLongPress, isAlone, theme
}) => (
	<Touchable
		onPress={onPress}
		onLongPress={onLongPress}
		style={[styles.imageContainer, isAlone && {width: 170}]}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		{children}
	</Touchable>
));

export const MessageImage = React.memo(({ img, theme, isOwn, isAlone }) => (
	<Image
		style={[isAlone?styles.image:styles.sliceImage, { textAlign:isOwn?'right':'left'}]}
		key={encodeURI(img)}
		source={{ uri: encodeURI(img) }}
		resizeMode={isAlone?FastImage.resizeMode.contain:FastImage.resizeMode.cover}
		indicator={ProgressBar}
		indicatorProps={{
			color: themes[theme].actionTintColor,
			style: isAlone? styles.imageIndicator : styles.sliceImageIndicator
		}}
	/>
));

const ImageContainer = React.memo(({
	file, imageUrl, getCustomEmoji,  theme, isOwn, textColor, isAlone
}) => {
	const { baseUrl, user, card } = useContext(MessageContext);
	const img = imageUrl || formatAttachmentUrl(file.image_url, user.id, user.token, baseUrl);
	if (!img) {
		return null;
	}

	if (file.description && isAlone) {
		return (
				<View style={styles.imageContainer}>
					<MessageImage img={img} theme={theme} isOwn={isOwn} isAlone={isAlone}/>
					<Markdown msg={file.description} baseUrl={baseUrl} username={card.username} getCustomEmoji={getCustomEmoji} style={[{ color: textColor?textColor:themes[theme].auxiliaryText }]} theme={theme} />
				</View>
		);
	}

	return (
		<MessageImage img={img} theme={theme} isOwn={isOwn} isAlone={isAlone}/>
	);
}, (prevProps, nextProps) => equal(prevProps.file, nextProps.file) &&  prevProps.isAlone === nextProps.isAlone && prevProps.theme === nextProps.theme);

ImageContainer.propTypes = {
	file: PropTypes.object,
	imageUrl: PropTypes.string,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	card: PropTypes.object,
	attach_cardId: PropTypes.string,
	rid: PropTypes.string,
	textColor: PropTypes.string,
	theme: PropTypes.string,
	getCustomEmoji: PropTypes.func,
	onLongPress: PropTypes.func,
	isOwn: PropTypes.bool,
	isAlone: PropTypes.bool
};
ImageContainer.displayName = 'MessageImageContainer';

MessageImage.propTypes = {
	img: PropTypes.string,
	isOwn: PropTypes.bool,
	isAlone: PropTypes.bool,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageImage';

Button.propTypes = {
	children: PropTypes.node,
	onPress: PropTypes.func,
	onLongPress: PropTypes.func,
	isOwn: PropTypes.bool,
	isAlone: PropTypes.bool,
	theme: PropTypes.string
};
ImageContainer.displayName = 'MessageButton';

export default ImageContainer;

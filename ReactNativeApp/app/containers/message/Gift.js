import React, {useContext} from 'react';
import { View, Image, Text } from 'react-native';
import PropTypes from 'prop-types';
import FastImage from '@rocket.chat/react-native-fast-image';
import equal from 'deep-equal';
import Touchable from 'react-native-platform-touchable';

import I18n from '../../i18n';
import Markdown from '../markdown';
import styles from './styles';
import { themes } from '../../constants/colors';
import MessageContext from "./Context";

const Button = React.memo(({
	children, onPress, onLongPress, theme
}) => (
	<Touchable
		onPress={onPress}
		onLongPress={onLongPress}
		style={styles.giftContainer}
		background={Touchable.Ripple(themes[theme].bannerBackground)}
	>
		{children}
	</Touchable>
));

export const MessageGift = React.memo(({ img, isOwn }) => (
	<Image
		style={{...styles.giftImage, alignItems:(isOwn?'flex-end':'flex-start')}}
		source={{ uri: img }}
		resizeMode={FastImage.resizeMode.contain}
	/>
));

export const GiftLabel = React.memo(({ label, isOwn, theme }) => (
	<View style={isOwn?styles.giftOwnInnerContent:styles.giftOwnInnerContent}>
		<Text style={ [styles.text,{color: '#fff',}] }>
			{label}
		</Text>
	</View>
));

const GiftContainer = React.memo(({
	msg, theme, isOwn, downloadGiftEmoji
}) => {
	 const gift_info = JSON.parse(msg);
	 const { emoji_id, description } = gift_info;
	 const img = 'gift';
	 const label = isOwn?I18n.t('Sent_Gift'):I18n.t('Received_Gift');

	const onPress = () => {
		if(!isOwn){
			downloadGiftEmoji(emoji_id);
		}
	};
	const { onLongPress, card } = useContext(MessageContext);
	if (description) {
		return (
			<Button theme={theme} onPress={onPress} onLongPress={onLongPress}>
				<View style={{alignItems: isOwn?'flex-end':'flex-start'}}>
					<MessageGift img={img} theme={theme} isOwn={isOwn} />
					<View style={{maxWidth:200}}>
						<Markdown msg={description} username={card.username} theme={theme}/>
					</View>
					<GiftLabel label={label} isOwn={isOwn} theme={theme} />
				</View>
			</Button>
		);
	}

	return (
		<Button theme={theme} onPress={onPress} onLongPress={onLongPress}>
			<View style={{alignItems: isOwn?'flex-end':'flex-start'}}>
				<MessageGift img={img} theme={theme} />
				<GiftLabel label={label} isOwn={isOwn} theme={theme} />
			</View>
		</Button>
	);
}, (prevProps, nextProps) => prevProps.theme === nextProps.theme);

GiftContainer.propTypes = {
	theme: PropTypes.string,
	downloadGiftEmoji: PropTypes.func,
	isOwn: PropTypes.bool
};
GiftContainer.displayName = 'MessageGiftContainer';

MessageGift.propTypes = {
	img: PropTypes.string,
	theme: PropTypes.string
};
GiftContainer.displayName = 'MessageGift';

Button.propTypes = {
	children: PropTypes.node,
	theme: PropTypes.string
};
GiftContainer.displayName = 'MessageButton';

export default GiftContainer;

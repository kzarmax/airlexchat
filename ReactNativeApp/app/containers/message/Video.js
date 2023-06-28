import React, {useContext} from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text } from 'react-native';
import Image from 'react-native-image-progress';
import {isEqual} from 'lodash';
import FastImage from '@rocket.chat/react-native-fast-image';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import Markdown from '../markdown';
import MessageContext from "./Context";
import {isTablet} from "../../utils/deviceInfo";
import {getThumbnailDescription} from "../../utils/media";

const styles = StyleSheet.create({
	nonThumbnailContainer:{
        width: 170,
	},
	thumbnailContainer:{
        width: 170,
	},
	contentContainer: {
		flex: 1
	},
	nonContentContainer: {
		height: 85,
		flex: 1,
		backgroundColor: '#1f2329',
		alignItems:'center',
		justifyContent: 'center',
		width: '100%',
		borderRadius: 4
	},
    image: {
        width:'100%',
        maxWidth: 170,
        minHeight: 240,
    },
	sliceImage: {
		width: isTablet ? 150 : 100,
		height: isTablet ? 150 : 100
	},
    playIcon:{
		position: 'absolute',
		alignItems:'center',
		justifyContent: 'center',
		width: '100%',
		height: '100%'
    },
	videoContainer: {
	},
	sliceVideoContainer: {
		margin: 2,
		width: 100,
		height: 100
	}
});

const Video = React.memo(({
	file, getCustomEmoji, theme, textColor, isAlone
}) => {
	const { baseUrl, user } = useContext(MessageContext);

	if (!baseUrl) {
		return null;
	}

	let { thumbnail, file_description } = getThumbnailDescription(file.description);
	if(thumbnail){
		thumbnail = formatAttachmentUrl(thumbnail, user.id, user.token, baseUrl);
	}

	const iconSize = isAlone?54:32;

	return (
		<View style={ [thumbnail ? styles.thumbnailContainer : styles.nonThumbnailContainer, isAlone?styles.videoContainer:styles.sliceVideoContainer] }>
			<View style={ [thumbnail ? styles.contentContainer : styles.nonContentContainer, isAlone&&{ marginBottom: 6 }] }>
				{thumbnail?
					[
						<Image
							key={encodeURI(thumbnail)}
							source={{ uri: encodeURI(thumbnail) }}
							style={isAlone?styles.image:styles.sliceImage}
							resizeMode={isAlone?FastImage.resizeMode.contain:FastImage.resizeMode.cover}
						/>,
						<View style={[styles.playIcon]}>
							<CustomIcon
								name='play'
								size={iconSize}
								color={themes[theme].buttonText}
							/>
						</View>
					]
					:
					<CustomIcon
						name='play'
						size={iconSize}
						color={themes[theme].buttonText}
					/>
				}
			</View>
			{ isAlone?<Markdown msg={file_description} baseUrl={baseUrl} username={user.username} getCustomEmoji={getCustomEmoji} style={[{ color: textColor?textColor:themes[theme].auxiliaryText }]} theme={theme} />: null}
		</View>
	);
}, (prevProps, nextProps) => isEqual(prevProps.file, nextProps.file) && prevProps.isAlone === nextProps.isAlone && prevProps.theme === nextProps.theme);

Video.propTypes = {
	file: PropTypes.object,
	showAttachment: PropTypes.func,
	getCustomEmoji: PropTypes.func,
	textColor: PropTypes.string,
	isOwn: PropTypes.bool,
	isAlone: PropTypes.bool,
	theme: PropTypes.string
};

export default Video;

import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import Image from 'react-native-image-progress';
import {isEqual} from 'lodash';
import FastImage from '@rocket.chat/react-native-fast-image';
import { CustomIcon } from '../../lib/Icons';
import { formatAttachmentUrl } from '../../lib/utils';
import { themes } from '../../constants/colors';
import Markdown from "../../containers/markdown";

const styles = StyleSheet.create({
	nonThumbnailContainer:{
		width:'100%',
		alignItems:'center',
		justifyContent: 'center',
		backgroundColor: '#1f2329',
		height: 200
	},
	thumbnailContainer:{
		width:'100%',
		flex: 1,
	},
    image: {
        width:'100%',
        minHeight: 500,
        borderRadius: 4,
    },
    playIcon:{
		alignItems:'center',
		justifyContent: 'center',
		width:'100%',
		height: '100%'
    }
});

const Video = React.memo(({
	file, user, baseUrl, theme
}) => {

	let thumbnail = null;
	if(file.description){
		try{
			const json_description = JSON.parse(file.description);
			thumbnail = formatAttachmentUrl(json_description.thumbnail, user.id, user.token, baseUrl)
		} catch (e){
		}
	}

	return (
		<View style={ [thumbnail ? styles.thumbnailContainer : styles.nonThumbnailContainer] }>
			{thumbnail?
				[
					<Image
						key={encodeURI(thumbnail)}
						source={{ uri: encodeURI(thumbnail) }}
						style={styles.image}
						resizeMode={FastImage.resizeMode.contain}
					/>,
					<View style={[styles.playIcon, thumbnail?{ position: 'absolute' }:null]}>
						<CustomIcon
							name='play'
							size={100}
							color={themes[theme].buttonText}
						/>
					</View>
				]
				:
				<CustomIcon
					name='play'
					size={100}
					color={themes[theme].buttonText}
				/>
			}
		</View>
	);
}, (prevProps, nextProps) => isEqual(prevProps.file, nextProps.file) && prevProps.theme === nextProps.theme);

Video.propTypes = {
	file: PropTypes.object,
	baseUrl: PropTypes.string,
	user: PropTypes.object,
	theme: PropTypes.string
};

export default Video;

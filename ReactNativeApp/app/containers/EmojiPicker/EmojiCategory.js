import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import shortnameToUnicode from '../../utils/shortnameToUnicode';
import styles from './styles';
import CustomEmoji from './CustomEmoji';
import Touchable from 'react-native-platform-touchable';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { themes } from '../../constants/colors';
import {withDimensions} from "../../dimensions";

const EMOJI_SIZE = 50;
let EMOJIS_PER_ROW;

const renderEmoji = (emoji, size, baseUrl) => {
	if (emoji && emoji.isCustom) {
		return <CustomEmoji style={[styles.customCategoryEmoji, { height: size - 8, width: size - 8 }]} emoji={emoji} baseUrl={baseUrl} />;
	}
	return (
		<Text style={[styles.categoryEmoji, { height: size, width: size, fontSize: size - 14 }]}>
			{shortnameToUnicode(`:${ emoji }:`)}
		</Text>
	);
};

class EmojiCategory extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		emojis: PropTypes.any,
		width: PropTypes.number,
		height: PropTypes.number,
		onEmojiSelected: PropTypes.func,
		emojisPerRow: PropTypes.number,
		containerWidth: PropTypes.number,
		isCustomEmojis: PropTypes.bool,
		theme: PropTypes.string,
	}

	constructor(props) {
		super(props);
		this.emojis = props.emojis;
		this.state={
			isShowingGif: false
		}
	}

	renderItem(emoji, size) {
		const { baseUrl, onEmojiSelected } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.isCustom ? emoji.content : emoji}
				onPress={() => {onEmojiSelected(emoji)}}
			>
				{renderEmoji(emoji, size, baseUrl)}
			</TouchableOpacity>
		);
	}

	shouldComponentUpdate(nextProps, nextState, nextContext) {
		const { isShowingGif } = this.state;
		const { width, height, containerWidth } = this.props;
		if(isShowingGif !== nextState.isShowingGif){
			return true;
		}

		if(containerWidth !== nextProps.containerWidth){
			return true;
		}

		if(!height !== nextProps.height){
			return true;
		}

		return width !== nextProps.width;
	}

	toggleEmojiView(isGif){
		this.setState({isShowingGif: isGif});
	}

	render() {
		const { isShowingGif } = this.state;
		const { containerWidth, width, height, emojisPerRow, isCustomEmojis, emojis, theme } = this.props;

		if (isCustomEmojis){

			EMOJIS_PER_ROW = 4;
			const is_horiental = width > height;
			if(is_horiental){
				EMOJIS_PER_ROW *= 2;
			}
			this.size = (containerWidth || width) / (emojisPerRow || EMOJIS_PER_ROW);

		} else {
			this.size = EMOJI_SIZE;
			EMOJIS_PER_ROW = Math.trunc(containerWidth / EMOJI_SIZE);
		}

		const marginHorizontal = (containerWidth - (EMOJIS_PER_ROW * this.size)) / 2;


		if (!isCustomEmojis){
			return (
				<FlatList
					contentContainerStyle={{ marginHorizontal }}
					// first click not working
					keyboardShouldPersistTaps={'handled'}
					key={`emoji-category-${ containerWidth }-${EMOJIS_PER_ROW}`}
					keyExtractor={item => (item.isCustom && item.content) || item}
					data={emojis}
					renderItem={({ item }) => this.renderItem(item, this.size)}
					numColumns={EMOJIS_PER_ROW}
					initialNumToRender={45}
					getItemLayout={(data, index) => ({ length: this.size, offset: this.size * index, index })}
					removeClippedSubviews
				/>
			);
		}

		const renderEmojis = emojis.filter(item => { return (isShowingGif && item.extension === 'gif') || (!isShowingGif && item.extension !== 'gif')});

		let textGifStyle = { ...styles.categoryIcon, color: isShowingGif?themes[theme].activeTintColor:themes[theme].inactiveTintColor};

		return (
			<View style={{ ...styles.emojiListContainer, marginHorizontal }}>
				<FlatList
					keyboardShouldPersistTaps={'handled'}
					key={`emoji-category-${ containerWidth }-${ EMOJIS_PER_ROW }`}
					style={styles.emojiList}
					keyExtractor={item => (item.isCustom && item.content) || item}
					data={renderEmojis}
					renderItem={({ item }) => this.renderItem(item, this.size)}
					numColumns={EMOJIS_PER_ROW}
					initialNumToRender={45}
					getItemLayout={(data, index) => ({ length: this.size, offset: this.size * index, index })}
					removeClippedSubviews
				/>
				<View style={{ justifyContent: 'center', flexDirection: 'row'}}>
					<Touchable
						onPress={() => this.toggleEmojiView(true)}
					>
						<Text style={textGifStyle}>GIF</Text>
					</Touchable>
					<Touchable
						onPress={() => this.toggleEmojiView(false)}
					>
						<Icon name='image' size={20} style={styles.categoryIcon} color={ isShowingGif?themes[theme].inactiveTintColor:themes[theme].activeTintColor } />
					</Touchable>
				</View>
			</View>
		);
	}
}

export default withDimensions(EmojiCategory);

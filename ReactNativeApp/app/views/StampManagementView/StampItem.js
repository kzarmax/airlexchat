import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';
import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import Button from '../../containers/Button';
import I18n from '../../i18n';
import {themes} from "../../constants/colors";

const Item = React.memo(({
	emojis, title, onPress, onViewAll, baseUrl, theme
}) => (
	<View style={styles.itemContainer}>
		<Text style={{ ...styles.sectionTitle, color: themes[theme].titleText }}>{ title }</Text>
		<ScrollView horizontal={true} {...scrollPersistTaps} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojisContainer}>
			{emojis.map((item, i) => {
				return (
					<TouchableOpacity onPress={ () => onPress(item) } style={ styles.emojiBody}>
						<CustomEmoji baseUrl={ baseUrl } style={ styles.customEmoji } emoji={ item }/>
						<Text style={{ ...styles.emojiLabel, color: themes[theme].auxiliaryText }}>{item.content}</Text>
					</TouchableOpacity>
					)})}
		</ScrollView>
		<View style={styles.sectionBtnArea}>
			<Button
				testID='emoji-view-more'
				type='primary'
				size='Y'
				text={I18n.t('View_More')}
				onPress={onViewAll}
				theme={theme}
			/>
		</View>
	</View>
));

Item.propTypes = {
	emojis: PropTypes.array,
	title: PropTypes.string,
	baseUrl: PropTypes.string,
	onPress: PropTypes.func,
	onViewAll: PropTypes.func,
	theme: PropTypes.string
};

export default Item;

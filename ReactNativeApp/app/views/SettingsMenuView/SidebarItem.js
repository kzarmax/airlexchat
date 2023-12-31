import React from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';
import {themes} from "../../constants/colors";

const Item = React.memo(({
	left, text, onPress, testID, current, theme
}) => (
	<RectButton
		key={testID}
		testID={testID}
		onPress={onPress}
		underlayColor='#292E35'
		activeOpacity={0.1}
		style={[styles.item, current && styles.itemCurrent]}
	>
		<View style={styles.itemLeft}>
			{left}
		</View>
		<View style={styles.itemCenter}>
			<Text style={{ ...styles.itemText, color: themes[theme].bodyText }}>
				{text}
			</Text>
		</View>
	</RectButton>
));

Item.propTypes = {
	left: PropTypes.element,
	text: PropTypes.string,
	current: PropTypes.bool,
	onPress: PropTypes.func,
	testID: PropTypes.string,
	theme: PropTypes.string.isRequired
};

export default Item;

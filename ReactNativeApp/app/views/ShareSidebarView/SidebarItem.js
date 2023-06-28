import React from 'react';
import { View, Text, Image } from 'react-native';
import PropTypes from 'prop-types';
import { RectButton } from 'react-native-gesture-handler';

import styles from './styles';

const Item = React.memo(({
	left, text, onPress, testID, current, showSort
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
			<Text style={styles.itemText}>
				{text}
			</Text>
		</View>

		{(() => {
			return showSort ? <Image style={styles.btn_sort_2} source={{ uri: 'btn_sort_2' }} /> : null;
		})()}

	</RectButton>
));

Item.propTypes = {
	left: PropTypes.element,
	text: PropTypes.string,
	current: PropTypes.bool,
	onPress: PropTypes.func,
	testID: PropTypes.string,
	showSort: PropTypes.bool
};

export default Item;

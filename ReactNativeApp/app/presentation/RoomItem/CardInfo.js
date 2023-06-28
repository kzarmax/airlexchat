import React from 'react';
import {Text, View} from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import { themes } from '../../constants/colors';
import Avatar from "../../containers/Avatar";

const CardInfo = React.memo(({
	myCardId, myCardName, theme
}) => (
	<View style={styles.rightContainer}>
		<View style={styles.cardImageContainer}>
			<Avatar text={myCardId} borderRadius={6} size={30} type='ci'/>
		</View>
		<View style={styles.cardTextContainer}>
			<Text style={{ ...styles.cardNameText, color: themes[theme].auxiliaryText }} ellipsizeMode='tail' numberOfLines={2}>{ myCardName }</Text>
		</View>
	</View>
));

CardInfo.propTypes = {
	myCardId: PropTypes.string,
	theme: PropTypes.string,
	myCardName: PropTypes.bool
};

export default CardInfo;

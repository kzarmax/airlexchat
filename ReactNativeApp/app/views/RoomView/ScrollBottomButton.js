import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';

import { isNotch, isIOS } from '../../utils/deviceInfo';
import { CustomIcon } from '../../lib/Icons';
import { COLOR_BUTTON_PRIMARY } from '../../constants/colors';

const styles = StyleSheet.create({
	button: {
		position: 'absolute',
		width: 42,
		height: 42,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#EAF2FE',
		borderRadius: 21,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1
		},
		shadowOpacity: 0.20,
		shadowRadius: 1.41,
		elevation: 2
	}
});


const ScrollBottomButton = React.memo(({ show, onPress, landscape, isShowingEmojiKeyboard, isShowingKeyboard }) => {
	if (show) {

		let right;
		let bottom = 80;
		if(isIOS){
			bottom = 100;
		}
		if (isNotch) {
			bottom = 120;
		}

		if (landscape) {
			right = 90;
		} else {
			right = 30;
		}

		let realButtom = bottom;
		if(isShowingEmojiKeyboard){
			if(!isIOS || (isIOS && isShowingKeyboard)){
				realButtom=landscape?240:360;
			}
		} else {
			if(isIOS){
				if(isShowingKeyboard) {
					realButtom=landscape?270:400;
				}
			}
		}

		return (
			<TouchableOpacity
				activeOpacity={0.8}
				style={[styles.button, { right, bottom: realButtom }]}
				onPress={onPress}
			>
				<CustomIcon name='arrow-down' color={COLOR_BUTTON_PRIMARY} size={30} />
			</TouchableOpacity>
		);
	}
	return null;
});

ScrollBottomButton.propTypes = {
	show: PropTypes.bool.isRequired,
	onPress: PropTypes.func.isRequired,
	landscape: PropTypes.bool,
	isShowingEmojiKeyboard: PropTypes.bool,
	isShowingKeyboard: PropTypes.bool
};
export default ScrollBottomButton;

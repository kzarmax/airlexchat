import React from 'react';
import { View, Text } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PropTypes from 'prop-types';

import { formatLastMessage, BUTTON_HIT_SLOP } from './utils';
import styles from './styles';
import I18n from '../../i18n';
import { themes } from '../../constants/colors';
import {CustomIcon} from "../../lib/Icons";

const CallButton = React.memo(({
	theme, callJitsi, type
}) => {
	const icon = type==='jitsi_call_started'?
		(<CustomIcon name='phone' size={16} style={styles.buttonIcon} color={themes[theme].buttonText} />):
		(<CustomIcon name='camera' size={16} style={styles.buttonIcon} color={themes[theme].buttonText} />);

	const joinCall = ()=>{
		callJitsi(type === 'jitsi_call_started');
	};

	return (
		<View style={styles.buttonContainer}>
			<Touchable
				onPress={joinCall}
				background={Touchable.Ripple(themes[theme].bannerBackground)}
				style={[styles.button, styles.smallButton, { backgroundColor: themes[theme].tintColor }]}
				hitSlop={BUTTON_HIT_SLOP}
			>
				<>
					{ icon }
					<Text style={[styles.buttonText, { color: themes[theme].buttonText }]}>{I18n.t('Click_to_join')}</Text>
				</>
			</Touchable>
		</View>
	);
});

CallButton.propTypes = {
	theme: PropTypes.string,
	callJitsi: PropTypes.func,
	type: PropTypes.string
};
CallButton.displayName = 'CallButton';

export default CallButton;

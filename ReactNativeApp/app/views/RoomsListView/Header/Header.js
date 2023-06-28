import React from 'react';
import {
	Text, View, TouchableOpacity, StyleSheet, Image
} from 'react-native';
import PropTypes from 'prop-types';

import I18n from '../../../i18n';
import sharedStyles from '../../Styles';
import { themes } from '../../../constants/colors';
import { isTablet, isIOS } from '../../../utils/deviceInfo';
import { useOrientation } from '../../../dimensions';
import Avatar from "../../../containers/Avatar";
import Status from "../../../containers/Status/Status";

const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	cardIconButton: {
		shadowColor: '#000',
		shadowRadius: 2,
		shadowOpacity: 0.4,
		shadowOffset: {
			width: 0,
			height: 2
		},
		elevation: 8
	},
	content: {
		flexDirection: 'column'
	},
	title: {
		...sharedStyles.textSemibold,
		lineHeight: 24,
		marginLeft: 8
	},
	subtitle: {
		marginLeft: 8,
	},
	typing: {
		...sharedStyles.textRegular,
		color: '#9EA2A8',
		fontSize: 12
	},
	typingUsers: {
		...sharedStyles.textSemibold,
		fontWeight: '600'
	},
	status: {
		position: 'absolute',
		bottom: -3,
		right: -3,
		borderColor: '#fff',
		borderWidth: 1
	}
});


const Header = React.memo(({
	selected, selectAll, connecting, isFetching, connected, onPress, baseUrl, user, theme
}) => {
	const {isLandscape} = useOrientation();
	const scale = isIOS && isLandscape && !isTablet ? 0.8 : 1;
	const titleFontSize = 18 * scale;
	const subTitleFontSize = 14 * scale;
	const cardIconSize = 32 * scale;

	// 全てのカード選択時
	let dispCardName = selected ? selected.name : '';
	if (selectAll) {
		dispCardName = I18n.t('All_Card');
	}

	let subtitle = null;
	let status = 'online';
	if (connecting) {
		subtitle = I18n.t('Connecting');
		status = 'away';
	} else if (isFetching) {
		subtitle = I18n.t('Updating');
		status = 'away';
	} else if (!connected) {
		subtitle = I18n.t('Waiting_for_network');
		status = 'offline';
	}

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={onPress}
				testID='rooms-list-header-server-dropdown-button'
			>
				<View style={[styles.titleContainer, isIOS&&{ maxWidth: '85%' }]}>
					<View style={styles.cardIconButton}>
						{
							selectAll ?
								<Image style={{width: cardIconSize, height: cardIconSize}}
									   source={{uri: 'card_all'}}/>
								:
								selected ?
									<Avatar
										key='rooms-list-header-card'
										borderRadius={6}
										type='ci'
										text={selected._id}
										size={cardIconSize}
									/>
									: null
						}
						<Status style={styles.status} size={10} status={status} />
					</View>
					<View style={styles.content}>
						<Text style={{...styles.title, fontSize: titleFontSize, color: themes[theme].titleText}} ellipsizeMode='tail' numberOfLines={1}>{dispCardName}</Text>
						{subtitle ?
							<Text style={[styles.subtitle, {color: themes[theme].auxiliaryText, fontSize: subTitleFontSize}]} numberOfLines={1}>{subtitle}</Text> : null}
					</View>
				</View>
			</TouchableOpacity>
		</View>
	);
});

Header.propTypes = {
	onPress: PropTypes.func,
	baseUrl: PropTypes.string,
	user: PropTypes.shape({
		id: PropTypes.string,
		username: PropTypes.string,
		token: PropTypes.string
	}),
	selected: PropTypes.object,
	selectAll: PropTypes.bool,
	connecting: PropTypes.bool,
	connected: PropTypes.bool,
	isFetching: PropTypes.bool,
	theme: PropTypes.string
};

Header.defaultProps =
	serverName: 'エアレペルソナ'
};

export default Header;

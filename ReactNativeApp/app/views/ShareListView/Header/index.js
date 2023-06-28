import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, LayoutAnimation, Image
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import { isEqual } from 'lodash';
import equal from 'deep-equal';

import I18n from '../../../i18n';
import Avatar from '../../../containers/Avatar';
import sharedStyles from '../../Styles';
import { isIOS } from '../../../utils/deviceInfo';
import {themes} from "../../../constants/colors";
import {withDimensions} from "../../../dimensions";

const TITLE_SIZE = 18;
const CARD_ICON_SIZE = 32;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
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
	title: {
		...sharedStyles.textSemibold,
		color: '#0C0D0F',
		marginLeft: 8,
		marginRight: isIOS ? 0 : 65,
		fontSize: TITLE_SIZE,
		maxWidth: '70%'
	},
	typing: {
		...sharedStyles.textRegular,
		color: '#9EA2A8',
		fontSize: 12
	},
	typingUsers: {
		...sharedStyles.textSemibold,
		fontWeight: '600'
	}
});

@connect((state) => {
	const roomType = state.room.t;

	let otherUsersTyping = [];
	if (state.login.user && state.login.user.username) {
		const { username } = state.login.user;
		const { usersTyping } = state.room;
		otherUsersTyping = usersTyping.filter(_username => _username !== username);
	}

	return {
		baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
		user: {
			id: state.login.user && state.login.user.id,
			username: state.login.user && state.login.user.username,
			token: state.login.user && state.login.user.token
		},
		usersTyping: otherUsersTyping,
		type: roomType,
		selected: state.cards && state.cards.selected,
		selectAll: state.cards && state.cards.selectAll
	};
})
class ShareListView extends Component {
	static propTypes = {
		navigation: PropTypes.object,
		baseUrl: PropTypes.string,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		type: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		usersTyping: PropTypes.array,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		isCompressing: PropTypes.bool,
		theme: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, selected, selectAll, usersTyping, width, height, isCompressing, theme
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (!isEqual(nextProps.selected, selected)) {
			return true;
		}
		if (nextProps.isCompressing !== isCompressing){
			return true;
		}
		if (nextProps.selectAll !== selectAll) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.height !== height) {
			return true;
		}
		if (!equal(nextProps.usersTyping, usersTyping)) {
			return true;
		}
		return nextProps.theme !== theme;
	}

	componentDidUpdate(prevProps) {
		if (isIOS) {
			const { usersTyping } = this.props;
			if (!equal(prevProps.usersTyping, usersTyping)) {
				LayoutAnimation.easeInEaseOut();
			}
		}
	}

	get compressing() {
		const { isCompressing, theme } = this.props;
		if(!isCompressing){
			return null;
		}
		return (
			<Text style={{ ...styles.typing, color: themes[theme].auxiliaryText }} numberOfLines={1}>
				{ I18n.t('is_compressing') }...
			</Text>
		);
	}

	renderCardIcon = () => {
		const {
			navigation, selected, selectAll, width, height
		} = this.props;
		const portrait = height > width;
		let scale = 1;

		if (!portrait) {
			scale = 0.8;
		}
		// 全てのカード選択時
		if (selectAll) {
			return (
				<View style={styles.cardIconButton}>
					<RectButton onPress={navigation.toggleDrawer}>
						<Image style={{ width: CARD_ICON_SIZE * scale, height: CARD_ICON_SIZE * scale }} source={{ uri: 'card_all' }} />
					</RectButton>
				</View>
			);
		}
		return (
			<View style={styles.cardIconButton}>
				<RectButton onPress={navigation.toggleDrawer}>
					{ selected ? (
						<Avatar
							key='rooms-list-header-card'
							borderRadius={6}
							type='ci'
							text={selected._id}
							size={CARD_ICON_SIZE * scale}
						/>
					) : null }
				</RectButton>
			</View>
		);
	}

	render() {
		const {
			selected, selectAll, theme
		} = this.props;

		// 全てのカード選択時
		let dispCardName = selected ? selected.name : '';
		if (selectAll) {
			dispCardName = I18n.t('All_Card');
		}

		return (
			<View style={styles.container}>
				<View style={styles.titleContainer}>
					{this.renderCardIcon()}
					<Text style={[styles.title, { fontSize: TITLE_SIZE, color: themes[theme].titleText }]} ellipsizeMode='tail' numberOfLines={1}>{dispCardName}</Text>
				</View>
				{this.compressing}
			</View>
		);
	}
}

export default withDimensions(ShareListView);

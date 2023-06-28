import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, LayoutAnimation, TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import Avatar from '../../../containers/Avatar';
import sharedStyles from '../../Styles';
import { isIOS } from '../../../utils/deviceInfo';
import {themes} from "../../../constants/colors";
import {withDimensions} from "../../../dimensions";
import {withTheme} from "../../../theme";
import {CustomIcon} from "../../../lib/Icons";
import Markdown from "../../../containers/markdown";

const TITLE_SIZE = 18;
const CARD_ICON_SIZE = 32;
const styles = StyleSheet.create({
	container: {
		flex: 1
	},
	titleContainer: {
		flex: 1,
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
		marginLeft: 8,
		lineHeight: 24,
		marginRight: 80,
		fontSize: TITLE_SIZE,
		flex: 1
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


class RoomHeaderView extends Component {
	static propTypes = {
		card: PropTypes.object,
		tmid: PropTypes.string,
		title: PropTypes.string,
		type: PropTypes.string,
		selectAll: PropTypes.bool,
		cards: PropTypes.array,
		goRoomActionsView: PropTypes.func,
		theme: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, selectAll, card, tmid, title, cards, theme
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (nextProps.tmid !== tmid) {
			return true;
		}
		if (nextProps.title !== title) {
			return true;
		}
		if (nextProps.selectAll !== selectAll) {
			return true;
		}
		if (!equal(nextProps.cards, cards)) {
			return true;
		}
		if (!equal(nextProps.card, card)) {
			return true;
		}
		return nextProps.theme !== theme;
	}

	getName() {
		const { cards, card } = this.props;
		const target = cards.find(c => (c._id === card._id));
		return target && target.name ? target.name : null;
	}

	renderCardIcon = () => {
		const {	card } = this.props;

		return (
			<View style={styles.cardIconButton}>
				<Avatar
					key='room-header-card'
					borderRadius={6}
					type='ci'
					text={card._id}
					size={CARD_ICON_SIZE}
				/>
			</View>
		);
	}

	onPress = () => {
		const { tmid, goRoomActionsView } = this.props;
		if (!tmid) {
			goRoomActionsView();
		}
	};

	render() {
		const { tmid, title, theme } = this.props;
		if(tmid){
			return (
				<View style={styles.titleContainer}>
					<CustomIcon
						name={'threads'}
						size={20}
						style={{ color: themes[theme].headerTitleColor }}
					/>
					<Markdown
						preview
						msg={title}
						style={[styles.title, { color: themes[theme].headerTitleColor }]}
						numberOfLines={1}
						theme={theme}
						testID={`room-view-title-${ title }`}
					/>
				</View>
			);
		}

		return (
			<TouchableOpacity onPress={ this.onPress } disabled={tmid} style={styles.container}>
				<View style={styles.titleContainer}>
					{this.renderCardIcon()}
					<Text style={{...styles.title, color: themes[theme].headerTitleColor }} numberOfLines={1} ellipsizeMode={'tail'}>{this.getName()}</Text>
				</View>
			</TouchableOpacity>
		);
	}
}


const mapStateToProps = (state) => ({
	selectAll: state.cards && state.cards.selectAll,
	cards: state.cards && state.cards.cards,
});

export default connect(mapStateToProps)(withTheme(RoomHeaderView));

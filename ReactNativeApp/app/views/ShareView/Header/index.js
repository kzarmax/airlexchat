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

const TITLE_SIZE = 18;
const CARD_ICON_SIZE = 32;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center'
	},
	titleContainer: {
		width: '80%',
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
		fontSize: TITLE_SIZE
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
	return {
		cards: state.cards && state.cards.cards
	};
})
class ShareHeaderView extends Component {
	static propTypes = {
		room: PropTypes.object,
		type: PropTypes.string,
		width: PropTypes.number,
		height: PropTypes.number,
		cards: PropTypes.array,
		widthOffset: PropTypes.number,
		theme: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			type, width, height, room, cards, theme
		} = this.props;
		if (nextProps.type !== type) {
			return true;
		}
		if (nextProps.width !== width) {
			return true;
		}
		if (nextProps.height !== height) {
			return true;
		}
		if (!equal(nextProps.cards, cards)) {
			return true;
		}
		if (!equal(nextProps.room, room)) {
			return true;
		}
		return nextProps.theme !== theme
	}

	getName() {
		const { cards, room } = this.props;
		const {c} = room;
		const target = cards.find(card => (card._id === c._id));
		return target && target.name ? target.name : null;
	}

	render() {
		const {
			width, height, widthOffset, room, theme
		} = this.props;
		const {c} = room;
		const portrait = height > width;
		let scale = 1;
		if (!portrait) {
			scale = 0.8;
		}

		return (
			<TouchableOpacity style={[styles.container, { width: width - widthOffset }]}>
				<View style={styles.titleContainer}>
					<View style={styles.cardIconButton}>
						<Avatar
							key='room-header-card'
							borderRadius={6}
							type='ci'
							text={c._id}
							size={CARD_ICON_SIZE * scale}
						/>
					</View>
					<Text style={[styles.title, { fontSize: TITLE_SIZE * scale, color: themes[theme].titleText }]} numberOfLines={1}>{this.getName()}</Text>
				</View>
			</TouchableOpacity>
		);
	}
}

export default withDimensions(ShareHeaderView);

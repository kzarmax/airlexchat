import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, StyleSheet, LayoutAnimation, TouchableOpacity
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import I18n from '../../../i18n';
import Avatar from '../../../containers/Avatar';
import sharedStyles from '../../Styles';
import { isIOS } from '../../../utils/deviceInfo';
import {themes} from "../../../constants/colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import {withDimensions} from "../../../dimensions";
import * as HeaderButton from "../../../containers/HeaderButton";
import {withTheme} from "../../../theme";
import Status from "../../../containers/Status/Status";
import UnreadBadge from "../../../presentation/UnreadBadge";

const TITLE_SIZE = 18;
const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center'
	},
	titleContentContainer: {
		flex: 1,
		justifyContent: 'center'
	},
	titleStringContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 48
	},
	title: {
		...sharedStyles.textSemibold,
		fontSize: TITLE_SIZE,
		paddingHorizontal: 16
	},
	typing: {
		...sharedStyles.textRegular,
		fontSize: 12,
		marginLeft: 16
	},
	typingUsers: {
		...sharedStyles.textSemibold,
		fontWeight: '600'
	},
	toggleIconButton: {
		height: 4,
		width: 7,
		marginLeft: 10,
		alignItems: 'center',
		justifyContent: 'center'
	},
	status: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		borderColor: '#fff',
		borderWidth: 1
	},
	badge: {
		position: 'absolute',
		top: 0,
		right: 4
	}
});

class CustomHeaderView extends Component {
	static propTypes = {
		rid: PropTypes.string,
		roomIconId: PropTypes.string,
		roomUserId: PropTypes.string,
		roomName: PropTypes.string,
		tmid: PropTypes.string,
		tunread: PropTypes.array,
		t: PropTypes.string,
		usersTyping: PropTypes.array,
		status: PropTypes.string,
		collapsed: PropTypes.bool,
		width: PropTypes.number,
		height: PropTypes.number,
		threadsEnabled: PropTypes.bool,
		toggleExpanded: PropTypes.func,
		onGoToThreads: PropTypes.func,
		theme: PropTypes.string
	};

	shouldComponentUpdate(nextProps) {
		const {
			t, tunread,  status, usersTyping, tmid, roomName, collapsed,  width, height, theme
		} = this.props;
		if (nextProps.t !== t) {
			return true;
		}
		if (nextProps.roomName !== roomName) {
			return true;
		}
		if (nextProps.tmid !== tmid){
			return true;
		}
		if (nextProps.tunread !== tunread){
			return true;
		}
		if (nextProps.collapsed !== collapsed) {
			return true;
		}
		if (nextProps.status !== status) {
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

	typing = () => {
		const { usersTyping, t, theme } = this.props;
		let usersText;

		if (!usersTyping.length) {
			return null;
		}

		if(t === 'd'){
			return (
				<Text style={[styles.typing, {color: themes[theme].auxiliaryText}]} numberOfLines={1}>
					{ I18n.t('typing') }...
				</Text>
			);
		}

		if (usersTyping.length === 2) {
			usersText = usersTyping.join(` ${ I18n.t('and') } `);
		} else {
			usersText = usersTyping.join(', ');
		}

		return (
			<Text style={[styles.typing, {color: themes[theme].auxiliaryText}]} numberOfLines={1}>
				<Text style={styles.typingUsers}>{usersText} </Text>
				{ usersTyping.length > 1 ? I18n.t('are_typing') : I18n.t('is_typing') }...
			</Text>
		);
	}

	renderCardAvatar = () => {
		const {
			roomIconId, t, rid, status
		} = this.props;
		return (
			<View style={{ position: 'relative' }}>
				<Avatar
					key='room-list-header-avatar'
					style={styles.cardIconButton}
					borderRadius={22}
					type={t === 'p' ? t : 'ca'}
					text={roomIconId}
					size={44}
					rid={rid}
				/>
				{ t === 'd' ?
					<Status style={styles.status} size={12} status={status} />
					: null
				}
			</View>
		);
	}

	rendertoggleIcon = () => {
		const {
			t, collapsed, theme
		} = this.props;

		if (t === 'p' && collapsed !== undefined) {
			return (
				collapsed ?
					<MaterialIcons name={'keyboard-arrow-down'} size={24} color={themes[theme].auxiliaryText} />
					: <MaterialIcons name={'keyboard-arrow-up'} size={24} color={themes[theme].auxiliaryText}/>
			);
		}

		return null;
	}

	render() {
		const {
			width, height, usersTyping, tmid, roomName, threadsEnabled, toggleExpanded, onGoToThreads, tunread, theme
		} = this.props;

		const portrait = height > width;
		let scale = 1;

		if (!portrait) {
			if (usersTyping.length > 0) {
				scale = 0.8;
			}
		}

		return (
			<View style={styles.container}>
				<TouchableOpacity onPress={toggleExpanded} style={styles.titleContainer}>
					{this.renderCardAvatar()}
					<View style={styles.titleContentContainer}>
						<View style={styles.titleStringContainer}>
							<Text style={[styles.title, { fontSize: TITLE_SIZE * scale, color: themes[theme].titleText }]} ellipsizeMode='tail' numberOfLines={1}>{roomName}</Text>
							{this.rendertoggleIcon()}
						</View>
						{this.typing()}
					</View>
				</TouchableOpacity>
				{ !tmid &&
					<HeaderButton.Container>
						{threadsEnabled ? (
							<HeaderButton.Item
								title='threads'
								titleStyle
								iconName='threads'
								onPress={onGoToThreads}
								testID='room-view-header-threads'
							/>
						) : null}
						{ (tunread?.length) ?
							<UnreadBadge
								style={styles.badge}
								unread={0}
								userMentions={[]}
								groupMentions={[]}
								tunread={tunread}
								tunreadUser={[]}
								tunreadGroup={[]}
								small
							/> : null
						}
					</HeaderButton.Container>
				}
			</View>
		);
	}
}


const mapStateToProps = (state, ownProps) => {
	let statusText;
	let status = 'offline';
	const {
		roomUserId, t, visitor = {}, tmid
	} = ownProps;

	if (state.meteor.connected) {
		if ((t === 'd' || (tmid && roomUserId)) && state.activeUsers[roomUserId]) {
			({status, statusText} = state.activeUsers[roomUserId]);
		} else if (t === 'l' && visitor?.status) {
			({status} = visitor);
		}
	}

	return {
		usersTyping: state.usersTyping,
		status,
		threadsEnabled: state.settings.Threads_enabled
	};
};

export default connect(mapStateToProps, null)(withDimensions(withTheme(CustomHeaderView)));

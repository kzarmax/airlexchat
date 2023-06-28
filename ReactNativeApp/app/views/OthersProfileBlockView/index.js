import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import Button from '../../containers/Button';
import Avatar from '../../containers/Avatar';
import { showToast } from '../../utils/info';
import log from '../../utils/log';
import RocketChat from '../../lib/rocketchat';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class OthersProfileBlockView extends React.Component {
	static navigationOptions = () => ({
		title: I18n.t('Block_Setting')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.rid = props.route.params?.rid;
		this.room = props.route.params?.room;
		this.state = {
			room: this.room,
			member: {},
			friendCard: props.route.params.friendCard,
			friendInfo: props.route.params.friendInfo
		};
	}

	async componentDidMount() {
		const { room } = this.state;
		if (room && room.t !== 'd') {
			return;
		} else if (room.t === 'd') {
			await this.updateRoomMember();
		}
		// this.rooms.addListener(this.updateRoom);
	}


	shouldComponentUpdate(nextProps, nextState) {
		const {
			room, member
		} = this.state;
		if (!equal(nextState.room, room)) {
			return true;
		}
		if (!equal(nextState.room, room)) {
			return true;
		}
		if (!equal(nextState.member, member)) {
			return true;
		}
		return false;
	}

	// ブロック状態を保存する
	blockAction = async() => {
		const { navigation } = this.props;
		const { friendInfo } = this.state;
		const params = {
			friendId: friendInfo._id,
			block: !friendInfo.block
		};

		try {
			const result = await RocketChat.updateFriend(params);
			if (result.success && !friendInfo.block) {
				showToast(I18n.t('friend_block_save'));
				navigation.navigate('RoomsListView', params);
			} else if (result.success && friendInfo.block) {
				showToast(I18n.t('friend_unblock_save'));
				navigation.navigate('RoomsListView', params);
			}
		} catch (e) {
			log(e);
		}
	}

	updateRoomMember = async() => {
		const { room } = this.state;
		const { rid, cardId } = room;
		// const { user } = this.props;

		try {
			const member = await RocketChat.getRoomMember(rid, cardId);
			this.setState({ member: member || {} });
		} catch (e) {
			log(e);
			this.setState({ member: {} });
		}
	}

	toggleBlockUser = async() => {
		const { navigation } = this.props;
		const { room } = this.state;
		const { rid, cardId, blocker } = room;
		const { member } = this.state;
		try {
			await RocketChat.toggleBlockUser(rid, cardId, member._id, !blocker);
			if (!room.blocker) {
				showToast(I18n.t('friend_block_save'));
				navigation.navigate('RoomsListView');
			} else if (room.blocker) {
				showToast(I18n.t('friend_unblock_save'));
				navigation.navigate('RoomsListView');
			}
		} catch (e) {
			log(e);
		}
	}

	render() {
		const { friendCard, room } = this.state;
		const { theme } = this.props;
		const block = room.blocker;
		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='profilard_scene-view'
				>
					<View style={styles.textCenter}>
						<Text style={{ ...styles.cardName, color: themes[theme].auxiliaryText }}>{friendCard.card.username}{I18n.t('QRAfterAddText1')}</Text>
						<Text style={{ ...styles.afterAddText, color: themes[theme].auxiliaryText }}>{!block ? I18n.t('BlockText') : I18n.t('BlockOffText')}</Text>
						<Avatar
							key='qr-after-read-card-avatar'
							borderRadius={40}
							type='ca'
							text={friendCard.card._id}
							size={80}
						/>
						<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{friendCard.card.username}</Text>
					</View>
					<View>
						<Text style={{ ...styles.blockCheckText, color: themes[theme].auxiliaryText }}>{!block ? I18n.t('BlockCheckText') : I18n.t('BlockOffCheckText')}</Text>
						<Text style={{ ...styles.blockCheckText2, color: themes[theme].auxiliaryText }}>{!block ? I18n.t('BlockCheckText2') : I18n.t('BlockOffCheckText2')}</Text>
					</View>
					<View style={styles.btnArea}>
						<Button
							testID='sidebar-toggle-status'
							type='done'
							text={!block ? I18n.t('Block_Btn') : I18n.t('Block_Off')}
							size='U'
							onPress={() => this.toggleBlockUser()}
							backgroundColor={!block ? '#C4CFD5' : '#66A9DD'}
							style={styles.blockBtn}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	}
}


const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		customFields: state.login.user && state.login.user.customFields,
		emails: state.login.user && state.login.user.emails,
		token: state.login.user && state.login.user.token
	},
	selected: state.cards && state.cards.selected,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(OthersProfileBlockView));

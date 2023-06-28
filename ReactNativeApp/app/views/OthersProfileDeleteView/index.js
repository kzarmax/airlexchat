import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import Button from "../../containers/Button";
import Avatar from "../../containers/Avatar";
import { showToast } from "../../utils/info";
import log from '../../utils/log';
import RocketChat from '../../lib/rocketchat';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class OthersProfileDeleteView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('CardDelete')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		selected: PropTypes.object,
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		const friendCard = props.route.params.friendCard;
		const friendInfo = props.route.params.friendInfo;
		const room = props.route.params.room;
		this.state = {
			friendCard,
			friendInfo,
			room
		};
	}

	// 友達を削除を保存する
	goDelete = async() => {
		const { navigation } = this.props;
		const { friendInfo } = this.state;

		const friendId = friendInfo._id;
		const cardId = friendInfo.cardId;
		const friendCardId = friendInfo.friendCardId;

		const params = {
			friendId,
			cardId,
			friendCardId
		};

		try {
			const result = await RocketChat.deleteFriend(friendId, cardId, friendCardId);
			if (result.success) {
				showToast(I18n.t('friend_delete'));
				navigation.navigate('RoomsListView', params);
			}
		} catch (e) {
			log(e);
		}
	}

	render() {
		const { friendCard } = this.state;
		const { theme } = this.props;
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
						<Text style={{ ...styles.afterAddText, color: themes[theme].auxiliaryText }}>{I18n.t('CardDeleteText')}</Text>
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
						<Text style={{ ...styles.blockCheckText, color: themes[theme].auxiliaryText }}>{I18n.t('CardDeleteCheckText')}</Text>
						<Text style={{ ...styles.blockCheckText2, color: themes[theme].auxiliaryText }}>{I18n.t('CardDeleteCheckText2')}</Text>
					</View>
					<View style={styles.btnArea}>
						<Button
							testID='sidebar-toggle-status'
							type='done'
							text={I18n.t('Delete')}
							size='U'
							onPress={() => this.goDelete()}
							backgroundColor='#F95522'
							style={styles.deleteBtn}
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

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(OthersProfileDeleteView));

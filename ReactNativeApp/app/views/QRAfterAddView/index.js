import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { CloseButtonGoQR } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import RCTextInput from '../../containers/TextInput';
import Button from '../../containers/Button';
import Avatar from '../../containers/Avatar';
import { showToast } from '../../utils/info';
import log from '../../utils/log';
import RocketChat from '../../lib/rocketchat';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class QRAfterAddView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseButtonGoQR navigation={navigation} testID='qr-after-add-view' />,
		title: I18n.t('FriendsAddView')
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

		const friendCard = props.route.params?.friendCard;
		const cardId = props.route.params?.cardId;
		this.state = {
			friendCard,
			cardId,
			memo: ''
		};
	}

	// シーンの詳細項目を表示
	sceneRender = () => {
		const { friendCard } = this.state;
		const profiles = friendCard.card.profiles;
		const rows = [];

		profiles.forEach((p) => {
			if (p.public) {
				rows.push(
					<View style={styles.sceneArea} key={`qr-card-select-view-key-${ p.name }`}>
						<Text style={styles.sceneName}>{p.name}</Text>
						<Text style={styles.sceneValue}>{p.value}</Text>
					</View>
				);
			}
		});

		return rows;
	}

	// メモを保存する
	saveMemo = async() => {
		const { friendCard, cardId, memo } = this.state;
		let friendInfo = [];
		try {
			const friendList = await RocketChat.getCardFriends(cardId);
			friendInfo = friendList.friends.find(f => f.friendCardId === friendCard.card._id);
		} catch (e) {
			log(e);
		}

		const friendId = friendInfo._id;
		const params = {
			friendId,
			memo
		};

		try {
			const result = await RocketChat.updateFriend(params);
			if (result.success) {
				showToast(I18n.t('friend_memo_saved'));
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
						<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{friendCard.card.username}{I18n.t('QRAfterAddText1')}</Text>
						<Text style={{ ...styles.afterAddText, color: themes[theme].bodyText }}>{I18n.t('QRAfterAddText2')}</Text>
						<Avatar
							key='qr-after-read-card-avatar'
							borderRadius={40}
							type='ca'
							text={friendCard.card._id}
							size={80}
						/>
						<Text style={styles.cardName}>{friendCard.card.username}</Text>
					</View>
					<View style={styles.commentArea}>
						<Text style={{ ...styles.comment, color: themes[theme].auxiliaryText }}>{I18n.t('profile_comment')}</Text>
						<Text style={{ ...styles.commentValue, color: themes[theme].bodyText }}>{friendCard.card.comment}</Text>
					</View>
					<RCTextInput
						inputRef={(e) => { this.name = e; }}
						label={I18n.t('Memo')}
						onChangeText={value => this.setState({ memo: value })}
						testID='qr-after-add-memo'
						theme={theme}
					/>
					{this.sceneRender()}
					<View style={styles.btnArea}>
						<Button
							testID='sidebar-toggle-status'
							type='primary'
							text={I18n.t('friend_memo_save')}
							size='w'
							onPress={() => this.saveMemo()}
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
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(QRAfterAddView));

import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import Avatar from '../../containers/Avatar';
import { setUser as setUserAction } from '../../actions/login';
import { CloseButtonGoQR } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import Button from '../../containers/Button';
import styles from './styles';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";


class QRAfterReadView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseButtonGoQR navigation={navigation} testID='qr-after-read-view' />,
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

		const friendCard = props.route.params;
		this.state = {
			friendCard
		};
	}

	// 次の画面へ遷移
	nextView = () => {
		const { navigation } = this.props;
		navigation.navigate('QRCardSelectView', this.state);
	}

	render() {
		const { friendCard } = this.state;
		const { baseUrl, user, theme } = this.props;
		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='qr-after-read-scroll-view'
				>
					<View style={styles.textCenter}>
						<Avatar
							key='qr-after-read-card-avatar'
							borderRadius={40}
							type='ca'
							text={friendCard.card._id}
							size={80}
						/>
						<Text style={{ ...styles.cardName, color: themes[theme].bodyText }}>{friendCard.card.username}</Text>
					</View>
					<View style={styles.commentArea}>
						<Text style={{ ...styles.comment, color: themes[theme].auxiliaryText }}>{I18n.t('profile_comment')}</Text>
						<Text style={{ ...styles.commentValue, color: themes[theme].bodyText }}>{friendCard.card.comment}</Text>
					</View>
					<View style={styles.btnArea}>
						<Button
							testID='qr-after-read-button'
							type='primary'
							text={I18n.t('friend_add_select_card')}
							size='w'
							onPress={() => this.nextView()}
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

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(QRAfterReadView));

import React from 'react';
import PropTypes from 'prop-types';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import {Keyboard, SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
import { connect } from 'react-redux';
import I18n from '../../i18n';
import styles from './styles';
import { themes } from "../../constants/colors";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CameraAddView from "./CameraAddView";
import EmailAddView from "./EmailAddView";
import IdAddView from "./IdAddView";
import {withTheme} from "../../theme";
import StatusBar from "../../containers/StatusBar";

const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

class FriendsAddView extends React.Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		navigation: PropTypes.object,
		selected: PropTypes.object
	};

	constructor(props) {
		super(props);
		// 初期値の設定
		this.state = {
			hasCameraPermission: false,
			focusedScreen: false
		};

		this.scanner = null;
	}

	componentDidMount() {
		const { navigation } = this.props;
		this.unsubscribeFocus = navigation.addListener('focus', () => setTimeout(()=>this.setState({ focusedScreen: true }), 300));
		this.unsubscribeBlur = navigation.addListener('blur', () => this.setState({ focusedScreen: false }));
	}

	componentWillUnmount() {
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	goToPage = (i) => {
		Keyboard.dismiss();
		if(this.tabViewRef){
			this.tabViewRef.goToPage(i);
		}
	}

	isActivePage = (i) => {
		return this.tabViewRef && this.tabViewRef.state.currentPage === i;
	}

	renderTab = () => {
		const { theme } = this.props;
		let tabs = [
			{ icon: "card-account-details-outline", text: 'ID' },
			{ icon: "qrcode", text: 'Camera' },
			{ icon: "email-outline", text: 'Email' }
		]
		return (
			<View style={styles.tabBarContainer} >
				{ tabs.map((tab, i) => (
					<TouchableOpacity
						activeOpacity={0.7}
						key={tab.text}
						onPress={() => this.goToPage(i)}
						style={styles.tab}
						testID={`friend-add-${ tab }`}
					>
						<Icon name={tab.icon} size={36} color={ this.isActivePage(i)?themes[theme].activeTintColor:themes[theme].inactiveTintColor } />
						{ this.isActivePage(i) ?
							<Text style={{ ...styles.tabText, color: themes[theme].activeTintColor, fontWeight: 'bold' }}>{tab.text}</Text>
							:
							<Text style={{ ...styles.tabText, color: themes[theme].inactiveTintColor }}>{tab.text}</Text>
						}
					</TouchableOpacity>
				))}
			</View>
		);
	}


	render() {
		const { theme, navigation, user, baseUrl, selected } = this.props;
		const { focusedScreen } = this.state;
		return (
			<SafeAreaView style={{ flex:1, backgroundColor: themes[theme].headerBackground }}>
				<StatusBar/>
				<Text style={{ ...styles.title, color: themes[theme].titleText }}>{I18n.t('FriendsAddView')}</Text>
				<ScrollableTabView
					ref={ref => this.tabViewRef = ref}
					renderTabBar={ this.renderTab }
					initialPage={1}
					contentProps={scrollProps}
				>
					<IdAddView theme={theme} navigation={navigation} user={user} baseUrl={baseUrl} selected={selected} />
					<CameraAddView theme={theme} navigation={navigation} user={user} baseUrl={baseUrl} selected={selected} focusedScreen={focusedScreen}/>
					<EmailAddView theme={theme} navigation={navigation} />
				</ScrollableTabView>
			</SafeAreaView>

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
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	selected: state.cards && state.cards.selected
});

export default connect(mapStateToProps)(withTheme(FriendsAddView));

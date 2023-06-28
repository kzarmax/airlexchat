import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Linking, ScrollView, View, LayoutAnimation, SafeAreaView, Alert, Share
} from 'react-native';
import { connect } from 'react-redux';
import equal from 'deep-equal';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { logout as logoutAction } from '../../actions/login';
import { ROOT_LOADING, appStart as appStartAction } from '../../actions/app';
import { selectServerRequest as selectServerRequestAction } from '../../actions/server';
import I18n from '../../i18n';
import { isIOS } from '../../utils/deviceInfo';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import SidebarItem from './SidebarItem';
import { showConfirmationAlert } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import {CONTACT_US_LINK, FAQ_LINK, TERMS_OF_SERVICE_LINK} from "../../constants/links";
import openLink from "../../utils/openLink";

class SettingsMenuView extends Component {
	static navigationOptions = () => ({
		title: I18n.t('Settings')
	})

	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		server:	PropTypes.object,
		Site_Name: PropTypes.string.isRequired,
		selectServerRequest: PropTypes.func,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		appStart: PropTypes.func,
		activeItemKey: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			showStatus: false,
			status: []
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { status, showStatus } = this.state;
		const {
			Site_Name, user, baseUrl, activeItemKey, theme
		} = this.props;
		if (nextState.showStatus !== showStatus) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.Site_Name !== Site_Name) {
			return true;
		}
		if (nextProps.baseUrl !== baseUrl) {
			return true;
		}
		if (nextProps.activeItemKey !== activeItemKey) {
			return true;
		}
		if (nextProps.user && user) {
			if (nextProps.user.language !== user.language) {
				return true;
			}
			if (nextProps.user.status !== user.status) {
				return true;
			}
			if (nextProps.user.username !== user.username) {
				return true;
			}
			if (nextProps.user.textsize !== user.textsize) {
				return true;
			}
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!equal(nextState.status, status)) {
			return true;
		}
		return false;
	}

	toggleStatus = () => {
		LayoutAnimation.easeInEaseOut();
		this.setState(prevState => ({ showStatus: !prevState.showStatus }));
	}

	sidebarNavigate = (route) => {
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	logout = () => {
		const { logout } = this.props;
		logout();
	}

	handleFaq = async () => {
		await openLink(FAQ_LINK);
	}

	handleContact = async() => {
		await openLink(CONTACT_US_LINK);
	}

    handleTermsOfService = async() => {
        await openLink(TERMS_OF_SERVICE_LINK);
    };

	handleShare = () => {
		const permalink = isIOS ? 'https://apps.apple.com/jp/app/id1466592518' : 'https://play.google.com/store/apps/details?id=chat.airlex.reactnative';
		Share.share({
			message: permalink
		});
	};

	handleClearCache = () => {
		showConfirmationAlert({
			message: I18n.t('This_will_clear_all_your_offline_data'),
			callToAction: I18n.t('RESET'),
			onPress: async() => {
				const {
					server: { server }, appStart, selectServerRequest
				} = this.props;
				await appStart({ root: ROOT_LOADING, text: I18n.t('Clear_cache_loading') });
				await RocketChat.clearCache({ server });
				await selectServerRequest(server);
			}
		});
	}

	renderNavigation = () => {
		const { activeItemKey, theme } = this.props;
		return (
			<>
				<SidebarItem
					text={I18n.t('CardAdd')}
					left={<Feather size={20} color={themes[theme].bodyText} name='user-plus' />}
					onPress={() => this.sidebarNavigate('NewCardView')}
					testID='settings-newcard'
					current={activeItemKey === 'SettingsStack'}
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Card_Editing')}
					left={<Feather size={20} color={themes[theme].bodyText} name='user' />}
					onPress={() => this.sidebarNavigate('ProfileView')}
					testID='settings-profile'
					current={activeItemKey === 'ProfileStack'}
					theme={theme}
				/>
				{/*<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />*/}
				{/*<SidebarItem*/}
				{/*	text={I18n.t('Stamp_Management')}*/}
				{/*	left={<Feather size={20} color={themes[theme].bodyText} name={'smile'} />}*/}
				{/*	onPress={() => this.sidebarNavigate('StampManagementView')}*/}
				{/*	testID='settings-stamp-management'*/}
				{/*	current={activeItemKey === 'SettingsStack'}*/}
				{/*	theme={theme}*/}
				{/*/>*/}
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Create_Group')}
					left={<Feather size={20} color={themes[theme].bodyText} name='users' />}
					onPress={() => this.sidebarNavigate('GroupCardSelectView')}
					testID='settings-group'
					current={activeItemKey === 'SettingsStack'}
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Theme')}
					left={<Feather size={20} color={themes[theme].bodyText} name='sun' />}
					onPress={() => this.sidebarNavigate('TextSizeView')}
					testID='settings-textsize'
					current={activeItemKey === 'SettingsStack'}
					theme={theme}
				/>
				{/*<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />*/}
				{/*<SidebarItem*/}
				{/*	text={I18n.t('Point_Store')}*/}
				{/*	left={<Feather size={20} color={themes[theme].bodyText} name={'credit-card'} />}*/}
				{/*	onPress={() => this.sidebarNavigate('PointStoreView')}*/}
				{/*	testID='settings-point_store'*/}
				{/*	current={activeItemKey === 'SettingsStack'}*/}
				{/*	theme={theme}*/}
				{/*/>*/}
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('FAQ')}
					left={<Feather size={20} color={themes[theme].bodyText} name='help-circle' />}
					onPress={this.handleFaq}
					testID='settings-faq'
					current={activeItemKey === 'SettingsStack'}
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Terms_of_Service')}
					left={<Feather size={20} color={themes[theme].bodyText} name='alert-circle' />}
					onPress={this.handleTermsOfService}
					testID='settings-terms_of_service'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Share')}
					left={<Feather size={20} color={themes[theme].bodyText} name='share-2' />}
					onPress={this.handleShare}
					testID='settings-share'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Contact_us')}
					left={<FontAwesome size={20} color={themes[theme].bodyText} name='handshake-o' />}
					onPress={this.handleContact}
					testID='settings-view-contact'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Account_Information')}
					left={<MaterialCommunityIcons size={22} color={themes[theme].bodyText} name='account-circle-outline' />}
					onPress={() => this.sidebarNavigate('AccountView')}
					testID='settings-account-information'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Clear_cache')}
					left={<Feather size={20} color={themes[theme].bodyText} name='refresh-cw' />}
					onPress={this.handleClearCache}
					testID='settings-clear-cache'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Logout')}
					left={<Feather size={20} color={themes[theme].bodyText} name='log-out' />}
					onPress={() => Alert.alert(
						I18n.t('Logout'),
						I18n.t('Do_you_want_to_log_out'),
						[
							{ text: I18n.t('Logout'), onPress: this.logout, style: 'destructive' },
							{ text: I18n.t('Cancel'), onPress: () => {}, style: 'cancel' }
						],
						{ cancelable: false }
					)}
					testID='settings-logout'
					theme={theme}
				/>
				<View style={{ ...styles.sectionSeparatorBorder, borderColor: themes[theme].borderColor }} />
				<SidebarItem
					text={I18n.t('Delete_Account')}
					left={<Feather size={20} color={themes[theme].bodyText} name='user-x' />}
					onPress={() => this.sidebarNavigate('DeleteAccountView')}
					testID='settings-delete-account'
					current={activeItemKey === 'SettingsStack'}
					theme={theme}
				/>
			</>
		);
	}

	render() {
		const { showStatus } = this.state;
		const { user, theme } = this.props;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='settings-menu-view' style={styles.container}>
				<ScrollView style={{ backgroundColor: themes[theme].backgroundColor }} {...scrollPersistTaps}>
					{!showStatus ? this.renderNavigation() : null}
				</ScrollView>
			</SafeAreaView>
		);
	}
}


const mapStateToProps = state => ({
	Site_Name: state.settings.Site_Name,
	server: state.server,
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch(logoutAction()),
	selectServerRequest: params => dispatch(selectServerRequestAction(params)),
	appStart: params => dispatch(appStartAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SettingsMenuView));

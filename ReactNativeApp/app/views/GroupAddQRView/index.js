import React from 'react';
import PropTypes from 'prop-types';
import {ActivityIndicator, ScrollView, Text, View, Image, SafeAreaView, TouchableOpacity, Keyboard} from 'react-native';
import { connect } from 'react-redux';
import Quark from '../../utils/qrCode/Quark'
import { isEqual } from 'lodash';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { CloseButtonGoTop } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import Button from '../../containers/Button';
import moment from 'moment';
import { themes } from '../../constants/colors';
import SearchBox from '../../containers/SearchBox';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import Avatar from '../../containers/Avatar';
import { withTheme } from '../../theme';
import { showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import debounce from '../../utils/debounce';
import ScrollableTabView from "react-native-scrollable-tab-view";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {getUTCTimeStamp} from "../../lib/utils";


const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

class GroupAddQRView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		// ヘッダーのボタン、動きはHeaderButtonへ記載
		headerLeft: () => <CloseButtonGoTop navigation={navigation} testID='group-add-qr-view-close' />,
		title: I18n.t('Invite_To_Group')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		navigation: PropTypes.object,
		selected: PropTypes.object
	}

	constructor(props) {
		super(props);

		const { baseUrl } = this.props;
		// 現在の時刻を取得
		const nowtime = getUTCTimeStamp();

		const rid = props.route.params?.rid;

		const updatedAt =  moment().format('YYYYMMDDhhmmss');
		// 初期値の設定
		this.state = {
			logoUrl: `${ baseUrl }/avatar/room/${ rid }?updatedAt=${updatedAt}`,
			now: nowtime,
			rid: rid,
			showOptionsDropdown: false,
			globalUsers: true,
			isSending: false,
			cardData: null,
			loading: false,
			text: '',
			type: 'card'
		};
	}

	// Reactのライフサイクル 新しいpropsを受け ると実行される
	componentWillReceiveProps(nextProps) {
		const { selected } = this.props;

		if (!isEqual(nextProps.selected, selected)) {
			this.createQrLogo();
		}
	}

	// QRコードに使用するロゴのURLを設定
	createQrLogo = () => {
		const { baseUrl } = this.props;
		const { rid } = this.state;

		const updatedAt =  moment().format('YYYYMMDDhhmmss');
		// カードアバター
		this.setState({
			logoUrl: `${ baseUrl }/avatar/room/${ rid }?updatedAt=${updatedAt}`
		});
	};

	// QRリーダー画面へ遷移
	goToBack = () => {
		const { navigation } = this.props;
		navigation.pop();
	};

	changeType = (type) => {
		this.setState({ type, cardData: null });
	};

	toggleWorkspace = () => {
		this.setState(({ globalUsers }) => ({ globalUsers: !globalUsers, cardData: null }), () => this.search());
	};

	toggleDropdown = () => {
		this.setState(({ showOptionsDropdown }) => ({ showOptionsDropdown: !showOptionsDropdown }));
	};

	onSearchChangeText = (text) => {
		this.setState({ text: text.trim(), cardData: null, loading: false });
	};

	// eslint-disable-next-line react/sort-comp
	load = debounce(async({ newSearch = false }) => {
		const {
			loading, text
		} = this.state;

		if (loading) {
			return;
		}

		if (newSearch) {
			this.setState({ cardData: null, total: -1, loading: false });
			if(text.length === 0)
				return;
		}

		this.setState({ loading: true });

		try {

			const result = await RocketChat.getCardDetail(text);

			if (result.success) {
				this.setState({
					cardData: result.card,
					loading: false,
				});
			} else {
				this.setState({ cardData:{}, loading: false });
			}
		} catch (e) {
			this.setState({ cardData:{}, loading: false });
		}
	}, 200);

	search = () => {
		this.load({ newSearch: true });
	};

	invite = async() => {
		const { rid, cardData  } = this.state;
		const { selected, navigation } = this.props;
		if(!cardData)
			return;
		this.setState({ isSending: true });
		try {
			const group = await RocketChat.inviteGroup(rid, selected._id, cardData._id);
			if (group) {
				// 成功メッセージ
				showToast(I18n.t('Invite_In_Group_Success', {name: cardData.username}));
				navigation.navigate('RoomsListView');
			} else {
				showToast(I18n.t('Invite_Failure'));
			}
		} catch (e) {
			// Already exist user`s card
			if(e.data && e.data.errorType === 'error-same-user'){
				showToast(I18n.t('err_same_user_in_group'));
			} else {
				showToast(I18n.t('Invite_Failure'));
			}
		}
		this.setState({ isSending: false });
	};

	renderQrCode() {
		const { now, logoUrl, rid } = this.state;
		const { baseUrl, selected, theme } = this.props;
		return (
			<KeyboardView
				key={'Camera'}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<View style={styles.qrView}>
					<View style={styles.cameraTop}>
						<Text style={{ ...styles.white, color: themes[theme].auxiliaryText }}>{I18n.t('QrTopText1')}</Text>
						<Text style={{ ...styles.white, color: themes[theme].auxiliaryText }}>{I18n.t('QrTopText2')}</Text>
					</View>
					<View style={styles.cameraView}>
						<Quark
							value={`${ baseUrl }/${ rid }/${ now }/group/${ selected._id }`}
							style={styles.qrcode}
						/>
						<Image
							source={{uri:logoUrl}}
							style={styles.logoImage}
						/>
					</View>
					<View style={styles.cameraBottom}>
						<Button
							onPress={() => this.goToBack()}
							testID='sidebar-toggle-status'
							type='primary'
							text={I18n.t('Close_And_Display_Group')}
							size='w'
							theme={theme}
						/>
					</View>
				</View>
			</KeyboardView>
		);
	}

	renderInviteWithID = () => {
		return (
			<KeyboardView
				key={'ID'}
				contentContainerStyle={sharedStyles.container}
				keyboardVerticalOffset={128}
			>
				<SearchBox
					onChangeText={this.onSearchChangeText}
					onSubmitEditing={this.search}
					testID='federation-view-search'
					placeholder={ I18n.t('Input_CardID')}
				/>
				{ this.renderCardData()}
			</KeyboardView>
		);
	};

	renderCardData = () => {
		const { cardData, isSending, loading, text } = this.state;
		const { baseUrl, theme } = this.props;

		if(loading)
			return (
				<View style={styles.selectCard}>
					<ActivityIndicator theme={theme} />
				</View>
			);

		if(!cardData || !cardData._id)
			return (
				<View style={{ ...styles.selectCard, backgroundColor: themes[theme].backgroundColor }}>
					<Text style={{ color: themes[theme].bodyText }}>{cardData && !cardData._id?I18n.t('Not_Exist_Card'):I18n.t('Please_Input_CardID')}</Text>
				</View>);

		const updatedAt = moment(cardData._updatedAt).format('YYYYMMDDhhmmss');
		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<ScrollView {...scrollPersistTaps} contentContainerStyle={sharedStyles.containerScrollView}>
					<View style={styles.selectCard} key={`card-detail-view-key`}>
						<View style={styles.avatarContainer}>
							<Avatar
								key='qr-card-select-avatar'
								borderRadius={40}
								type='ca'
								text={cardData._id}
								size={80}
							/>
							<View style={styles.avatarSide}>
								<Text style={{ ...styles.cardName, color: themes[theme].bodyText }} >{cardData.username}</Text>
								<Text style={{ ...styles.cardMessage, color: themes[theme].auxiliaryText }}>{cardData.comment}</Text>
							</View>
						</View>
					</View>
					<View style={styles.inviteBtn}>
						<Button
							title={I18n.t('Invite_To_Group')}
							type='done'
							size='W'
							onPress={this.invite}
							testID='invite-view-submit'
							loading={isSending}
							theme={theme}
						/>
					</View>
				</ScrollView>
			</KeyboardView>
		);
	};

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

	render = () => {
		const { theme } = this.props;
		return (
			<SafeAreaView style={{ flex:1, backgroundColor: themes[theme].headerBackground }}>
				<StatusBar/>
				<ScrollableTabView
					ref={ref => this.tabViewRef = ref}
					renderTabBar={ this.renderTab }
					initialPage={0}
					contentProps={scrollProps}
				>
					{this.renderInviteWithID()}
					{this.renderQrCode()}
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

export default connect(mapStateToProps)(withTheme(GroupAddQRView));

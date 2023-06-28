import React from 'react';
import PropTypes from 'prop-types';
import { Text, View, Image } from 'react-native';
import { connect } from 'react-redux';
import { isEqual } from 'lodash';
import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import Quark from '../../utils/qrCode/Quark'
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { CloseButtonGoQR } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import Button from '../../containers/Button';
import moment from 'moment';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import {getUTCTimeStamp} from "../../lib/utils";

class FriendsAddQRView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		// ヘッダーのボタン、動きはHeaderButtonへ記載
		headerLeft: () => <CloseButtonGoQR navigation={navigation} testID='friends-add-qr-view-close' />,
		title: I18n.t('FriendsAddView')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		navigation: PropTypes.object,
		selected: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		const { baseUrl, selected } = this.props;
		// 現在の時刻を取得
		const nowtime = getUTCTimeStamp();

		const updatedAt =  moment(selected._updatedAt).format('YYYYMMDDhhmmss');
		// 初期値の設定
		this.state = {
			logoUrl: `${ baseUrl }/avatar/${ selected && selected._id ? selected._id : 'xxx' }?updatedAt=${updatedAt}`,
			now: nowtime
		};
	}

	// Reactのライフサイクル 新しいpropsを受け取ると実行される
	componentWillReceiveProps(nextProps) {
		const { selected } = this.props;

		if (!isEqual(nextProps.selected, selected)) {
			this.createQrLogo();
		}
	}

	shouldComponentUpdate(nextProps) {
		const { selected, theme } = this.props;
		if (!isEqual(nextProps.selected, selected)) {
			return true;
		}
		return nextProps.theme !== theme;
	}

	// QRコードに使用するロゴのURLを設定
	createQrLogo = () => {
		const { baseUrl, selected } = this.props;

		const updatedAt =  moment(selected._updatedAt).format('YYYYMMDDhhmmss');
		// カードアバター
		this.setState({
			logoUrl: `${ baseUrl }/avatar/${ selected && selected._id ? selected._id : 'xxx' }?updatedAt=${updatedAt}`
		});
	}

	// QRリーダー画面へ遷移
	friendsAddView = () => {
		const { navigation } = this.props;
		navigation.navigate('FriendsAddView');
	}

	render() {
		const { now, logoUrl } = this.state;
		const { baseUrl, selected, theme } = this.props;
		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<View style={styles.qrView}>
					<View style={styles.cameraTop}>
						<Text style={{ ...styles.white, color: themes[theme].auxiliaryText }}>{I18n.t('QrTopText1')}</Text>
						<Text style={{ ...styles.white, color: themes[theme].auxiliaryText }}>{I18n.t('QrTopText2')}</Text>
					</View>
					<View style={styles.cameraView}>
						<View style={styles.qrContainer}>
							<Quark
								value={`${ baseUrl }/${ selected && selected._id ? selected._id : 'xxx' }/${ now }/card`}
								style={ styles.qrcode }
							/>
							<Image
								source={{uri:logoUrl}}
								style={styles.logoImage}
							/>
						</View>
					</View>
					<View style={styles.cameraBottom}>
						<Button
							onPress={() => this.friendsAddView()}
							testID='sidebar-toggle-status'
							type='primary'
							text={I18n.t('QRScanViewText')}
							size='w'
							theme={theme}
						/>
					</View>
				</View>
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
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	selected: state.cards && state.cards.selected
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(FriendsAddQRView));

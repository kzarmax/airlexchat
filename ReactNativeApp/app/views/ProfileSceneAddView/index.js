import React from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView, Text, View
} from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { CloseButtonGoTop } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';

import Button from '../../containers/Button';
import RocketChat from '../../lib/rocketchat';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import CheckBox from "../../containers/CheckBox";

class ProfileSceneAddView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseButtonGoTop navigation={navigation} testID='profile-scene-add-view' />,
		title: I18n.t('Scene_select_title')
	})

	static propTypes = {
		navigation: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			checked: 'scene1',
			tmpSceneNo: 11,
			addSceneNo: 0,
			addSceneText: null,
			profileTypes: [],
			scenes: [],
			disabled: false
		};

		this.init();
	}

	// シーン取得
	init = async() => {
		const { profileTypes, scenes } = await RocketChat.getSceneList();
		this.setState({
			propTypes: profileTypes,
			scenes
		});
	}

	// シーンの表示処理
	sceneList = () => {
		const {
			scenes, checked
		} = this.state;
		const { theme } = this.props;
		const sceneListTmp = scenes;
		const scenesList = [];

		// テンプレートシーンの表示
		sceneListTmp.forEach((val) => {
			if (val._id === 'scene11') {
				scenesList.push(
					<View style={styles.sectionSeparatorBorder} key={`sidebar-view-line-key-${ val._id }`} />
				);
			}
			scenesList.push(
				<CheckBox
					key={`profile-scene-add-key-${ val._id }`}
					title={val.name}
					checked={checked === val._id}
					onPress={() => this.setCheck(val._id)}
					onIconPress={() => this.setCheck(val._id)}
					checkedIcon='dot-circle-o'
					uncheckedIcon='dot-circle-o'
					checkedColor='red'
					unCheckedColor={themes[theme].bodyText}
					textStyle={{ color: themes[theme].bodyText }}
					containerStyle={{ ...styles.CheckBoxContainer, backgroundColor: themes[theme].backgroundColor }}
				/>
			);
		});
		return (scenesList);
	}

	// どのチェックボックスをチェックしているかの判断
	setCheck = (sceneNo) => {
		this.setState({
			checked: sceneNo,
			disabled: false
		});
	}

	// 追加シーンのテキストを配列へ追加する処理、追加後シーンの表示へ
	addScene = (text) => {
		if (text) {
			this.setState({
				addSceneText: text
			});
		}
	}

	// 次の画面へ遷移
	nextView = () => {
		const { navigation } = this.props;
		navigation.navigate('ProfileSceneAddDetailView', this.state);
	}

	render() {
		const { disabled } = this.state;
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
					<View style={styles.SceneSelectMessageBox}>
						<Text style={{ ...styles.SceneSelectMessage, color: themes[theme].auxiliaryText }}>
							{I18n.t('Scene_select_message')}
						</Text>
						<Text style={{ ...styles.SceneSelectMessage, color: themes[theme].auxiliaryText }}>
							{I18n.t('Scene_select_message_sub')}
						</Text>
						<Text style={{ ...styles.SceneSelectMessage, color: themes[theme].auxiliaryText }}>
							{I18n.t('Scene_info_message')}
						</Text>
					</View>
					{this.sceneList()}
					<View>
						<Button
							disabled={disabled}
							onPress={() => this.nextView()}
							testID='sidebar-toggle-status'
							type='done'
							text={I18n.t('Done')}
							size='w'
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

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(ProfileSceneAddView));

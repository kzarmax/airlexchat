import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, View } from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import { setCards as setCardsAction } from '../../actions/cards';
import { CloseButtonGoTop } from '../../containers/HeaderButton';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import RCTextInput from '../../containers/TextInput';
import Button from '../../containers/Button';

import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";
import CheckBox from "../../containers/CheckBox";

class ProfileSceneAddDetaileView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		headerLeft: () => <CloseButtonGoTop navigation={navigation} testID='newcard-profile-view' />,
		title: I18n.t('Card_Editing')
	})

	static propTypes = {
		navigation: PropTypes.object,
		setCards: PropTypes.func.isRequired,
		selected: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);

		// 前の画面から選択したシーン情報を設定
		this.scene = {
			checked: props.route.params.checked,
			tmpSceneNo: props.route.params.tmpSceneNo,
			addSceneNo: props.route.params.addSceneNo,
			addSceneText: props.route.params.addSceneText
		};

		// この画面の初期値
		this.state = {
			name: '',
			username: '',
			comment: '',
			scene: [],
			profiles: [],
			detail: [],
			checked: [],
			addDetailNo: 0,
			addList: null,
			type: '',
			saving: false
		};

		this.init();
	}

	componentDidMount() {

	}

	// シーン詳細取得
	init = async() => {
		const id = this.scene.checked;
		const input = [];
		let profiles = [];
		let _scene = [];
		let sceneBase = [];

		const { scene } = await RocketChat.getSceneInfo(id);
		_scene = scene;
		profiles = scene.values;

		// ベース配列を生成
		if (profiles) {
			for (let i = 0; i < profiles.length; i += 1) {
				input[i] = {
					name: profiles[i].name,
					type: profiles[i].type
				};
			}
		}

		// シーン情報の設定
		sceneBase = {
			code: id,
			name: _scene.name
		};

		// シーン詳細の一覧を設定
		this.setState({
			detail: profiles,
			profiles: input,
			scene: sceneBase
		});
	}

	// 登録処理
	submit = async() => {
		const {
			scene, profiles
		} = this.state;
		const { setCards, selected } = this.props;

		this.setState({ saving: true });

		const params = {
			cardId: selected._id,
			name: selected.name,
			username: selected.username,
			comment: selected.comment,
			scene: scene,
			profiles: profiles
		};

		// 実行する
		try {
			const req = await RocketChat.updateCard(params);
			if (req.success) {
				showToast(I18n.t('new_card_save_true'));

				// 最新のカード一覧を設定する
				setCards(req.cards);

				const { navigation } = this.props;
				navigation.navigate('RoomsListView');
			}
		} catch (e) {
			this.handleError(e, 'createCard', 'new_card_save_failed');
			this.setState({ saving: false });
		}
	}

	// シーン詳細の入力内容を配列にセット
	setProfile = (title, value, no) => {
		const { profiles } = this.state;
		const input = profiles;

		switch (title) {
			case 'name':
				input[no] = { ...input[no], name: value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			case 'value':
				input[no] = { ...input[no], value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			case 'public':
				input[no] = { ...input[no], public: value, type: input[no] && input[no].type ? input[no].type : 'text' };
				break;
			default:
				break;
		}

		this.setState({ profiles: input });
	}

	// シーンの詳細項目を表示
	sceneRender = () => {
		const {
			detail, checked, addDetailNo, addList, profiles, scene, addSceneText
		} = this.state;
		const { theme } = this.props;

		const checks = checked;
		const addNo = addDetailNo;
		const rows = [];

		// テンプレートの表示
		if (detail) {
			for (let i = 0; i < detail.length; i += 1) {
				let isCheck = true;
				if (!checks[i] && !profiles[i].public) {
					isCheck = false;
				} else {
					isCheck = !!(checks[i]);
				}

				if (detail[i].name) {
					rows.push(
						<View style={styles.detailBox} key={`default-list-key-${ i }`}>
							<View style={styles.detailTitleArea}>
								<RCTextInput
									inputRef={(e) => { this.comment = e; }}
									placeholder={detail[i].name}
									onChangeText={value => this.setProfile('name', value, i)}
									onSubmitEditing={() => { this.comment.focus(); }}
									testID='new_card_profile_comment'
									style={styles.detailTitle}
									value={profiles[i].name}
									theme={theme}
								/>
							</View>
							<View style={styles.detailMainArea}>
								<RCTextInput
									inputRef={(e) => { this.comment = e; }}
									placeholder={I18n.t('Please_enter')}
									onChangeText={value => this.setProfile('value', value, i)}
									onSubmitEditing={() => { this.comment.focus(); }}
									testID='new_card_profile_comment'
									style={styles.detailMain}
									theme={theme}
								/>
							</View>
							<View style={styles.iconArea}>
								<CheckBox
									checkedIcon='eye'
									uncheckedIcon='eye'
									checked={isCheck}
									checkedColor={ themes[theme].bodyText }
									unCheckedColor={ themes[theme].inactiveTintColor }
									containerStyle={{ marginBottom: 10}}
									onPress={() => this.setCheck(i)}
									onIconPress={() => this.setCheck(i)}
								/>
							</View>
						</View>
					);
				}
			}
		}

		// 追加項目の表示
		if (addList != null) {
			const profileCount = detail && detail.length ? detail.length : 0;
			for (let j = 0; j < addNo; j += 1) {
				const no = profileCount + j;
				let isCheck = !!(checks[no]);

				rows.push(
					<View style={styles.detailBox} key={`add-list-key-${ j }`}>
						<View style={styles.detailTitleArea}>
							<RCTextInput
								inputRef={(e) => { this.comment = e; }}
								placeholder={I18n.t('Please_enter')}
								onChangeText={value => this.setProfile('name', value, no)}
								onSubmitEditing={() => { this.comment.focus(); }}
								testID='new_card_profile_comment'
								style={styles.detailTitle}
								theme={theme}
							/>
						</View>
						<View style={styles.detailMainArea}>
							<RCTextInput
								inputRef={(e) => { this.comment = e; }}
								placeholder={I18n.t('Please_enter')}
								onChangeText={value => this.setProfile('value', value, no)}
								onSubmitEditing={() => { this.comment.focus(); }}
								testID='new_card_profile_comment'
								style={styles.detailMain}
								theme={theme}
							/>
						</View>
						<View style={styles.iconArea}>
							<CheckBox
								checkedIcon='eye'
								uncheckedIcon='eye'
								checked={isCheck}
								checkedColor={ themes[theme].bodyText }
								unCheckedColor={ themes[theme].inactiveTintColor }
								containerStyle={{ marginBottom: 10}}
								onPress={() => this.setCheck(no)}
								onIconPress={() => this.setCheck(no)}
							/>
						</View>
					</View>
				);
			}
		}
		return rows;
	}

	// チェック状態の保存
	setCheck = (count) => {
		const {
			checked
		} = this.state;
		const checks = checked;

		// チェックフラグがない場合
		checks[count] = !(checks[count]);

		this.setProfile('public', checks[count], count);
		this.setState({ checked: checks });
	}

	// 自由項目の追加
	addSceneDetail = () => {
		const {
			addDetailNo, addList
		} = this.state;
		let addProfileList = [];
		const addNo = addDetailNo + 1;

		// 既に項目がある場合はaddList配列へ設定
		if (addList) {
			addProfileList = addList;
		}
		addProfileList.push(addNo);

		this.setState({
			addDetailNo: addNo,
			addList: addProfileList
		});

		// 追加シーンを表示
		this.sceneRender();
	}

	// 保存ボタンのON/OFF
	formIsChanged = () => {
		const {
			profiles
		} = this.state;

		let disabled = true;
		if (profiles.length) {
			profiles.forEach((i) => {
				if (i.value) {
					disabled = false;
				}
			});
		}
		return disabled;
	}

	render() {
		const {
			saving
		} = this.state;
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
					{this.sceneRender()}
					<View>
						<Button
							onPress={() => this.addSceneDetail()}
							testID='sidebar-toggle-status'
							type='primary'
							text={I18n.t('new_card_profile_add_btn')}
							size='w'
							icon='plus'
							theme={theme}
						/>
					</View>
					<View>
						<Button
							disabled={this.formIsChanged()}
							onPress={() => this.submit()}
							testID='sidebar-toggle-status'
							type='done'
							text={I18n.t('Done')}
							size='w'
							loading={saving}
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
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	Accounts_CustomFields: state.settings.Accounts_CustomFields,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params)),
	setCards: cards => dispatch(setCardsAction(cards))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(ProfileSceneAddDetaileView));

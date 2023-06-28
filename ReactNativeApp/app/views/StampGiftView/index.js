import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';

import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import styles from './styles';
import Button from '../../containers/Button';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import TextInput from '../../containers/TextInput';
import Modal from 'react-native-modal';
import database from '../../lib/database';
import { Q } from '@nozbe/watermelondb';
import Avatar from '../../containers/Avatar';
import equal from 'deep-equal';
import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import log, { LOG_L_LOW } from '../../utils/log';
import { themes } from '../../constants/colors';
import {withTheme} from "../../theme";
import CheckBox from "../../containers/CheckBox";

class StampGiftView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Stamp_Management')
	});

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		siteName: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			name: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		navigation: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const category = props.route.params?.category;
		this.state = {
			category,
			isShowingGiftEmoji: false,
			chatters: [],
			checked: {},
			gift_name: '',
			is_sendable: false,
			sending: false,
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { isShowingGiftEmoji, chatters, gift_name, checked, sending, is_sendable } = this.state;

		if(isShowingGiftEmoji !== nextState.isShowingGiftEmoji){
			return true;
		}

		if(sending !== nextState.sending){
			return true;
		}

		if(gift_name !== nextState.gift_name){
			return true;
		}

		if(is_sendable !== nextState.is_sendable){
			return true;
		}

		if(!equal(chatters, nextState.chatters)){
			return true;
		}

		return !equal(checked, nextState.checked);
	}

	componentDidMount() {
		this.getChatters();
	}

	getChatters = async() => {
		const { selected, selectAll } = this.props;

		const db = database.active;
		let subscriptions = [];
		if(selectAll) {
			subscriptions = await db.collections
				.get('subscriptions')
				.query(
					Q.where('archived', false),
					Q.where('open', true),
					Q.where('t', 'd')
				)
				.fetch();
		}
		else if(selected) {
			subscriptions = await db.collections
				.get('subscriptions')
				.query(
					Q.where('archived', false),
					Q.where('open', true),
					Q.where('cardId',selected._id),
					Q.where('t', 'd')
				)
				.fetch();
		}

		let chatters = [];
		let checked = {};
		subscriptions.map(subscription => {
			const { o, rid, ts, cardId } = subscription;
			chatters[o._id] = {
				id: o._id,
				cardId,
				rid,
				user: o,
				ts: ts
			};
			checked[o._id] = false;
		});
		this.setState({chatters, checked});
	};
	onGift = () => {
		this.setState({ isShowingGiftEmoji: true});
	};

	toggleCheck = (id) => {
		const { chatters, checked } = this.state;
		checked[id] = !checked[id];
		const chats = [];
		Object.keys(checked).forEach(key => {
			if(checked[key]){
				chats.push(chatters[key]);
			}
		});

		this.setState({ checked, is_sendable: chats.length > 0 });
		this.forceUpdate();
	};
	sendEmoji = async() => {
		const { navigation } = this.props;
		const { category, checked, chatters, gift_name } = this.state;

		const chats = [];
		Object.keys(checked).forEach(key => {
			if(checked[key]){
				const { cardId, rid, user} = chatters[key];
				chats.push({
					rid,
					cardId,
					userId: user.userId
				});
			}
		});
		LOG_L_LOW(' send', category, chats, gift_name);
		this.setState({ sending: true} );
		this.setState({ isShowingGiftEmoji: false});
		try{
			const result = await RocketChat.giftEmojiToOther(category.id, chats, gift_name);
			if(result.success){
				showToast(I18n.t('Success_gift_emoji'));
				navigation.pop();
			} else {
				showToast(I18n.t('err_gift_emoji'));
			}
		}catch(e){
			log(e, 'Send Gift Emoji Error:');
			showToast(I18n.t('err_gift_emoji'));
		}
		this.setState({ sending: false} );
	};

	renderChatter = ({item, index}) => {
		const { theme } = this.props;
		const { checked } = this.state;

		return (
			<TouchableOpacity onPress={() => this.toggleCheck(item.id)} style={styles.itemContainer}>
				<CheckBox
					checked={checked[item.id]}
					onPress={() => this.toggleCheck(item.id)}
					onIconPress={() => this.toggleCheck(item.id)}
					checkedIcon='check-square-o'
					uncheckedIcon='square-o'
					checkedColor='red'
					unCheckedColor={themes[theme].bodyText}
					textStyle={ themes[theme].bodyText }
					containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
				/>
				<Avatar text={item.id} borderRadius={18} size={36} type='ca' style={styles.avatar} rid={item.rid} />
				<Text style={{ fontSize: 16, fontWeight: 'bold', color: themes[theme].bodyText, paddingVertical: 8}}>{ item.user.username }</Text>
			</TouchableOpacity>
		);
	};

	renderGiftEmojiModal = () => {
		const {  baseUrl, siteName, theme } = this.props;
		const { chatters, category, isShowingGiftEmoji, is_sendable } = this.state;
		const chatter_list = Object.values(chatters);

		return (
			<Modal
				style={styles.modal}
				isVisible={isShowingGiftEmoji}
				onBackdropPress={() => this.setState({isShowingGiftEmoji: false})}
				onBackButtonPress={() => this.setState({isShowingGiftEmoji: false})}
				animationIn='slideInUp'
				animationOut='slideOutDown'
				useNativeDriver
				hideModalContentWhileAnimating
				avoidKeyboard
			>
				<View style={{ ...styles.modalContent, backgroundColor: themes[theme].backgroundColor }}>
					<Text style={{ fontSize: 20, fontWeight: 'bold', paddingTop: 16, textAlign: 'center', color: themes[theme].titleText }}>プレゼントするスタンプ</Text>
					<View style={{ flexDirection:'row', alignItems: 'center', padding: 8 }}>
						<CustomEmoji baseUrl={ baseUrl } style={ styles.titleEmoji } emoji={ category }/>
						<View style={{ paddingLeft: 8 }}>
							<Text style={{ ...styles.emojiCreator, color: themes[theme].auxiliaryText }}>{category.creator??siteName}</Text>
							<Text style={{ ...styles.emojiTitle, color: themes[theme].bodyText }}>{category.content}</Text>
						</View>
					</View>
					<View style={ styles.emojiSeparator }/>
					<FlatList
						keyExtractor={item => item.user._id}
						data={chatter_list}
						renderItem={this.renderChatter}
						showsVerticalScrollIndicator={false}
						{...scrollPersistTaps}
					/>
					<View style={ styles.emojiSeparator }/>
					<View style={{alignItems: 'center'}}>
						<TouchableOpacity onPress={this.sendEmoji} style={[styles.sendBtn, is_sendable?styles.enableBtn: styles.disableBtn]} disabled={!is_sendable}>
							<Text style={styles.btnText}>{ I18n.t('Send')}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		);
	};

	render() {
		const { baseUrl, theme } = this.props;
		const { category, sending } = this.state;

		return (
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }} testID='stamp-edit-view'>
				<View style={styles.header}>
					<TextInput
						label={I18n.t('Gift_Name')}
						placeholder={I18n.t('Please_enter_gift_name')}
						returnKeyType='done'
						onChangeText={value => this.setState({ gift_name: value })}
						onSubmitEditing={this.submit}
						theme={theme}
					/>
				</View>
				<View style={styles.body}>
					<CustomEmoji style={styles.customCategoryEmoji} emoji={category} baseUrl={baseUrl} />
					<Button
						title={I18n.t('Gift_to_friend_it')}
						type='done'
						size='W'
						onPress={this.onGift}
						testID='invite-view-submit'
						loading={sending}
						theme={theme}
					/>
				</View>
				{/*<View style={styles.btnArea}>*/}
				{/*	<Button*/}
				{/*		testID='sidebar-toggle-status'*/}
				{/*		type='done'*/}
				{/*		text={I18n.t('Delete_Stamp')}*/}
				{/*		size='U'*/}
				{/*		onPress={this.onDelete}*/}
				{/*		backgroundColor='#F95522'*/}
				{/*		style={styles.deleteBtn}*/}
				{/*	/>*/}
				{/*</View>*/}
				{ this.renderGiftEmojiModal()}
			</View>
		);
	}
}


const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	siteName: state.settings.Site_Name || 'エアレペルソナ',
});

const mapDispatchToProps = dispatch = ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(StampGiftView));

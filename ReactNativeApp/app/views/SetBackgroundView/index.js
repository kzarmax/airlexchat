import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { fromHsv, toHsv, TriangleColorPicker } from 'react-native-color-picker';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withTheme } from '../../theme';
import { themes } from '../../constants/colors';
import StatusBar from '../../containers/StatusBar';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import styles from './styles';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import { setCards as setCardsAction } from '../../actions/cards';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MessageComponent from '../../containers/message/Message';
import { DEFAULT_SERVER } from '../../constants/servers';
import Separator from '../RoomView/Separator';
import SafeAreaView from '../../containers/SafeAreaView';
import Loading from '../../containers/Loading';
import MessageContext from "../../containers/message/Context";

const user = {
	id: 'VLogjiwel342t235f',
	username: 'diego.mello',
	token: '79q6lH40W4ZRGLOshDiDiVlQaCc4f_lU9HNdHLAzuHz'
};
const author1 = {
	_id: 'y8bd77ptZswPj3EW8',
	username: 'diego.mello'
};
const author2 = {
	_id: '45bd77ptZswPlgIO4',
	username: 'User2'
};
const card = {
	_id: 'y8bd77ptZswPj3EW8',
};
const reads = [{ cardId: '45bd77ptZswPlgIO4'}, {cardId: 'y8bd77ptZswPj3EW8'}];
const date = new Date();

const Message = props => (
	<MessageContext.Provider
		value={{
			user: {user},
			baseUrl: {DEFAULT_SERVER},
			card: {card},
			onPress: () => {},
			onLongPress: () => {}
		}}
	>
		<MessageComponent
			author={props.author}
			ts={date}
			timeFormat='LT'
			isHeader
			theme={props.theme}
			isReadReceiptEnabled={true}
			{...props}
		/>
	</MessageContext.Provider>
);

const MessageSeparator = ({ dateSeparator, showUnreadSeparator, textColor, theme }) => (
	<Separator
		ts={dateSeparator}
		unread={showUnreadSeparator}
		textColor={textColor}
		theme={theme}
	/>
);

class SetBackgroundView extends React.Component{
	static navigationOptions = () => ({
		title: I18n.t('Set_Card_Background')
	});

	static propTypes = {
		navigation: PropTypes.object,
		setCards: PropTypes.func.isRequired,
		selected: PropTypes.object,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		const { theme } = props;
		const profile_back_color = props.route.params.back_color;
		const profile_text_color = props.route.params.text_color;
		this.state = {
			back_color: profile_back_color ? profile_back_color : themes[theme].backgroundColor,
			new_back_color: profile_back_color ? profile_back_color : null,
			text_color: profile_text_color ? profile_text_color : themes[theme].auxiliaryText,
			new_text_color: profile_text_color ? profile_text_color : null,
			currentTabIndex: 0,
			setting: false
		}

		this.tabs = [
			{ key: "BackgroundColor", icon: "format-color-fill", text: I18n.t('BackgroundColor') },
			{ key: "TextColor", icon: "format-color-text", text: I18n.t('TextColor') },
		]
	}


	setBackground = async(isReset = false) => {
		const { new_back_color, new_text_color } = this.state;
		const { selected, setCards, theme } = this.props;

		const params = {
			cardId: selected._id,
			back_color: (isReset || !new_back_color)? '#': new_back_color,
			text_color: (isReset || !new_text_color)? '#': new_text_color
		};

		this.setState({ setting: true });
		const req = await RocketChat.updateCard(params);
		this.setState({ setting: false });

		if (req.success) {
			await setCards(req.cards);
			if(isReset){
				this.setState({
					back_color: themes[theme].backgroundColor,
					text_color: themes[theme].auxiliaryText,
					new_back_color: themes[theme].backgroundColor,
					new_text_color: themes[theme].auxiliaryText,
				});
			} else {
				this.setState({
					back_color: new_back_color,
					text_color: new_text_color
				});
			}
			showToast(I18n.t('Set_Background_Success'));
		} else {
			showToast(I18n.t('Set_Background_Failure'));
		}
	}

	goToPage = (i) => {
		this.setState({currentTabIndex: i});
	}

	isActivePage = (i) => {
		const { currentTabIndex } = this.state;
		return currentTabIndex === i;
	}

	renderTab = () => {
		const { theme } = this.props;

		return (
			<View style={styles.tabBarContainer} >
				{ this.tabs.map((tab, i) => (
					<TouchableOpacity
						activeOpacity={0.7}
						key={tab.text}
						onPress={() => this.goToPage(i)}
						style={this.isActivePage(i)?styles.activeTab:styles.tab}
						testID={`friend-add-${ tab }`}
					>
						<Icon name={tab.icon} size={20} color={ this.isActivePage(i)?themes[theme].actionTintColor:themes[theme].inactiveTintColor } />
						{ this.isActivePage(i) ?
							<Text style={{ ...styles.tabText, color: themes[theme].actionTintColor, fontWeight: 'bold' }}>{tab.text}</Text>
							:
							<Text style={{ ...styles.tabText, color: themes[theme].inactiveTintColor }}>{tab.text}</Text>
						}
					</TouchableOpacity>
				))}
			</View>
		);
	}

	renderTabContent = () => {
		const { theme } = this.props;
		const { currentTabIndex, new_back_color, new_text_color } = this.state;
		if(currentTabIndex < 0){
			return null;
		}
		const default_color = (this.tabs[currentTabIndex].key === 'BackgroundColor'?toHsv(new_back_color??themes[theme].backgroundColor):toHsv(new_text_color??themes[theme].auxiliaryText));
		return (
			<View key={`${this.tabs[currentTabIndex].key}`} style={{ justifyContent: 'center', alignItems: 'center', marginVertical: 8 }}>
				<TriangleColorPicker
					ref={ref => this.picker = ref}
					defaultColor={ default_color }
					style={ styles.colorPicker }
					onColorChange={ color => {
						if(this.tabs[currentTabIndex].key === 'BackgroundColor'){
							this.setState({ new_back_color: fromHsv(color) });
						} else {
							this.setState({ new_text_color: fromHsv(color) });
						}
					}}
				/>
			</View>
		);
	}

	render() {
		const { theme } = this.props;
		const { new_back_color, new_text_color, setting } = this.state;

		return (
			<SafeAreaView
				style={{ flex: 1, backgroundColor: themes[theme].backgroundColor }}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='set-background-view'
					{...scrollPersistTaps}
				>
					<View style={styles.container}>
						<Text style={{ ...styles.itemLabel, color: themes[theme].titleText }}>{I18n.t('Preview')}</Text>
						<View style={{ ...styles.preview, backgroundColor: new_back_color}}>
							<MessageSeparator dateSeparator={date} textColor={new_text_color} theme={theme} />
							<Message
								msg='こんにちは'
								author={{
									...author1,
									username: 'あなた',
									name: 'あなた'
								}}
								isOwn
								reads={reads}
								textColor={new_text_color}
								theme={theme}
							/>
							<Message
								msg='こんにちは'
								author={{
									...author2,
									username: 'エアレペルソナ'
								}}
								textColor={new_text_color}
								theme={theme}
							/>
						</View>
						{this.renderTab()}
						{this.renderTabContent()}
					</View>
					<View style={styles.btnContainer}>
						<Button
							title={I18n.t('Settings')}
							type='primary'
							size='U'
							style={styles.modalButton}
							onPress={()=>this.setBackground()}
							theme={theme}
						/>
						<Button
							title={I18n.t('RESET')}
							type='primary'
							size='U'
							style={styles.modalButton}
							onPress={()=>this.setBackground(true)}
							theme={theme}
						/>
					</View>
					<Loading visible={setting} />
				</ScrollView>
			</SafeAreaView>
		);
	}
}

const mapStateToProps = state => ({
	selected: state.cards && state.cards.selected,
});

const mapDispatchToProps = dispatch => ({
	setCards: cards => dispatch(setCardsAction(cards)),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(SetBackgroundView));

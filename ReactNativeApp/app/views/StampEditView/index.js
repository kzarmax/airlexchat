import React from 'react';
import PropTypes from 'prop-types';
import { Dimensions, FlatList, ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';
import { connect } from 'react-redux';

import sharedStyles from '../Styles';
import I18n from '../../i18n';
import styles from './styles';
import Button from '../../containers/Button';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import log from '../../utils/log';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class StampEditView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Stamp_Management')
	});

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		siteName: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string,
			points: PropTypes.number,
		}),
		navigation: PropTypes.object,
		window: PropTypes.any,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		const category = props.route.params?.category;
		const is_downloaded = props.route.params?.is_downloaded;
		this.state = {
			category,
			is_downloaded,
			loading: false
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
	}

	componentDidUpdate(prevProps) {

	}

	renderItem(emoji, size) {
		const { baseUrl } = this.props;
		return (
			<TouchableOpacity
				activeOpacity={0.7}
				key={emoji.content}
				onPress={() => {}}
				testID={`reaction-picker-${emoji.content}`}
			>
				<CustomEmoji style={[styles.customCategoryEmoji, { height: size - 32, width: size - 32 }]} emoji={emoji} baseUrl={baseUrl} />
			</TouchableOpacity>
		);
	}

	onDelete = async() => {
		const { navigation } = this.props;
		const { category } = this.state;
		this.setState({loading: true});
		try{
			const result = await RocketChat.removeEmojiFromUser(category.id);
			if(result.success){
				showToast(I18n.t('Success_remove_emoji'));
			} else {
				showToast(I18n.t('err_remove_emoji'));
			}
		}catch(e){
			log(e);
			showToast(I18n.t('err_remove_emoji'));
		}
		this.setState({loading: false});
		navigation.pop();
	};

	onAdd = async() => {
		const { navigation, user } = this.props;
		const { category } = this.state;

		if(category.points > user.points){
			return showToast(I18n.t("Not_Enough_Point"));
		}
		this.setState({loading: true});
		try{
			const result = await RocketChat.downloadEmoji(category.id);
			if(result.success){
				showToast(I18n.t('Success_download_emoji'));
			} else {
				showToast(I18n.t('err_download_emoji'));
			}
		}catch(e){
			log(e);
			showToast(I18n.t('err_download_emoji'));
		}
		this.setState({loading: false});
		navigation.pop();
	};

	onGiftEmoji = (category) => {
		const { navigation } = this.props;
		navigation.navigate('StampGiftView', {category: category});
	};

	render() {
		const { window, baseUrl, siteName, user, theme } = this.props;
		const { category, loading, is_downloaded } = this.state;
		const emojis = Object.keys(category.children)
			.map(key => {
				return {
					content: category.children[key].name,
					title: category.children[key].alias,
					extension: category.children[key].extension,
					isCustom: true
				}
			});
		const EMOJIS_PER_ROW =  4;
		const { width: widthWidth, height: windowHeight } = window;
		const size = Math.min(widthWidth, windowHeight) / EMOJIS_PER_ROW;

		return (
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}  testID='stamp-edit-view'>
				<View style={styles.header}>
					<View style={{ flexDirection:'row', justifyContent: 'space-between', alignItems: 'center' }}>
						<View style={{ flexDirection:'row', alignItems: 'center' }}>
							<CustomEmoji baseUrl={ baseUrl } style={ styles.titleEmoji } emoji={ category }/>
							<View style={{ paddingHorizontal: 8, width: '100%' }}>
								<Text style={{ ...styles.emojiCreator, color: themes[theme].auxiliaryText }}>{category.creator??siteName}</Text>
								<Text style={{ ...styles.emojiTitle, color: themes[theme].bodyText }}>{category.content}</Text>
								<View style={styles.separator}/>
								{
									category.points?
									<>
										<View style={styles.pointContainer}>
											<Image style={styles.coinIcon} source={{ uri: 'icon_coin' }} />
											<Text style={styles.point}>{category.points}pt</Text>
										</View>
										<Text style={ styles.myPointLabel }>{I18n.t('My_Point')}: {user.points}pt</Text>
									</>
									:
									<Text style={ styles.freeLabel }>{I18n.t('Free')}</Text>
								}

							</View>
						</View>
					</View>
					<View style={ styles.btnArea }>
						<Button
							testID='emoji-view-more'
							type='primary'
							size='U'
							text={I18n.t('Gift_Emoji')}
							onPress={() => this.onGiftEmoji(category)}
							theme={theme}
						/>
						<Button
							testID='sidebar-toggle-status'
							type='done'
							text={is_downloaded?I18n.t('Delete_Stamp'):I18n.t('Add_Stamp')}
							size='U'
							onPress={is_downloaded?this.onDelete:this.onAdd}
							backgroundColor={is_downloaded?'#F95522':'#66a9dd'}
							loading={loading}
							theme={theme}
						/>
					</View>
				</View>
				<View style={styles.separator}/>
				<ScrollView style={styles.emojiList}>
					<FlatList
						keyExtractor={item => (item.isCustom && item.content) || item}
						data={emojis}
						renderItem={({ item }) => this.renderItem(item, size)}
						numColumns={EMOJIS_PER_ROW}
						initialNumToRender={45}
						getItemLayout={(data, index) => ({ length: size, offset: size * index, index })}
						removeClippedSubviews
						{...scrollPersistTaps}
					/>
				</ScrollView>
			</View>
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
		token: state.login.user && state.login.user.token,
		points: (state.login.user && state.login.user.points)??0,
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	siteName: state.settings.Site_Name || 'エアレペルソナ',
	window: Dimensions.get('window')
});

export default connect(mapStateToProps, null)(withTheme(StampEditView));

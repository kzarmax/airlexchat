import React from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, Image, View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { isIOS } from '../../utils/deviceInfo';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { connect } from 'react-redux';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import equal from 'deep-equal';
import { themes } from '../../constants/colors';
import {withTheme} from "../../theme";

class StampCategoriesView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Stamp_Management')
	});

	static propTypes = {
		userEmojis: PropTypes.array,
		userPoints: PropTypes.number,
		baseUrl: PropTypes.string.isRequired,
		siteName: PropTypes.string.isRequired,
		listRef: PropTypes.func,
		navigation: PropTypes.object,
		theme: PropTypes.string,
	};

	constructor(props) {
		super(props);
		const categories = props.route.params?.categories;
		const title = props.route.params?.title;
		this.mounted = false;
		this.state = {
			title,
			categories,
			animated: false,
		};
	}

	componentDidMount() {
		this.mounted = true;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { userEmojis, theme } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if(!equal(userEmojis, nextProps.userEmojis)){
			return true;
		}
		return false;
	}

	// eslint-disable-next-line react/sort-comp
	update = () => {
		const { animated } = this.state;
		if (animated) {
			animateNextTransition();
		}
		this.forceUpdate();
	};

	onPress = (category) => {
		const { userEmojis, navigation } = this.props;
		const is_downloaded = userEmojis.includes(category.id);
		navigation.navigate('StampEditView', { category, is_downloaded });
	};

	renderItem = ({ item, index }) => {
		const { baseUrl, userEmojis,userPoints, siteName, theme } = this.props;
		const childEmojis =  Object.keys(item.children)
			.map(index => ({
				content:item.children[index].name,
				title:item.children[index].alias,
				extension: item.children[index].extension,
				isCustom: true
			}));

		const isDownloaded = userEmojis.find(emojiId => emojiId === item.id);

		return (
			<View style={styles.emojiContainer}>
				<View style={{ flexGrow: 1, width: '75%', paddingLeft: 8 }}>
					<TouchableOpacity onPress={ () => this.onPress(item) } style={{ flexDirection:'row', justifyContent: 'space-between', alignItems:'center' }}>
						<View style={{ flexDirection:'row', alignItems:'center' }}>
							<CustomEmoji baseUrl={ baseUrl } style={ styles.titleEmoji } emoji={ item }/>
							<View style={{ paddingHorizontal: 8, marginTop: 8, width: '100%' }}>
								<Text style={{ ...styles.emojiCreator, color: themes[theme].auxiliaryText }}>{item.creator??siteName}</Text>
								<Text style={{ ...styles.emojiTitle, color: themes[theme].bodyText }}>{item.content}</Text>
								{
									item.points?
									<View style={styles.pointContainer}>
										<Image style={styles.coinIcon} source={{ uri: 'icon_coin' }} />
										<Text style={styles.point}>{item.points}pt</Text>
									</View>
									:
									<Text style={ styles.freeLabel }>{I18n.t('Free')}</Text>
								}
							</View>
						</View>
						<View style={ styles.downloadEmojiBtn }>
							{ isDownloaded ? <CustomIcon name='check' size={ 28 } color={ '#0576ff' }/> :null }
						</View>
					</TouchableOpacity>
					<ScrollView horizontal={true} {...scrollPersistTaps} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojisContainer}>
						{childEmojis.map((emoji, i) => <CustomEmoji baseUrl={ baseUrl } style={ styles.customEmoji } emoji={ emoji }/>)}
					</ScrollView>
				</View>
			</View>
		);
	};

	render() {
		const { listRef, theme } = this.props;
		const { title, categories } = this.state;

		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }}>
				<Text style={{ ...styles.pageTitle, color: themes[theme].titleText }}>{ title }</Text>
				<FlatList
					testID='room-view-messages'
					ref={listRef}
					keyExtractor={item => item.name}
					data={categories}
					extraData={this.state}
					renderItem={this.renderItem}
					contentContainerStyle={styles.emojiContentContainer}
					style={styles.emojiList}
					removeClippedSubviews={isIOS}
					showsVerticalScrollIndicator={false}
					initialNumToRender={7}
					maxToRenderPerBatch={5}
					windowSize={10}
					{...scrollPersistTaps}
				/>
			</View>
		);
	}
}

const mapStateToProps = state => ({
	userEmojis: state.login.user && state.login.user.emojis,
	userPoints: (state.login.user && state.login.user.points)??0,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	siteName: state.settings.Site_Name || 'エアレペルソナ',
});

export default connect(mapStateToProps)(withTheme(StampCategoriesView));

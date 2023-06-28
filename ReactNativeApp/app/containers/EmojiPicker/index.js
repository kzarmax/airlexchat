import React, { Component } from 'react';
import { View } from 'react-native';
import PropTypes from 'prop-types';
import ScrollableTabView from 'react-native-scrollable-tab-view';
import { connect } from 'react-redux';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import TabBar from './TabBar';
import EmojiCategory from './EmojiCategory';
import styles from './styles';
import database from '../../lib/database';
import { emojisByCategory } from '../../emojis';
import protectedFunction from '../../lib/methods/helpers/protectedFunction';
import shortnameToUnicode from '../../utils/shortnameToUnicode';
import log from '../../utils/log';
import { themes } from '../../constants/colors';
import { withTheme } from '../../theme';
import { BorderlessButton } from "react-native-gesture-handler";
import I18n from '../../i18n';
import CustomEmoji from '../EmojiPicker/CustomEmoji';
import { setCurrentCustomEmoji as setCurrentCustomEmojiAction, setShowingAddEmojiModal } from '../../actions/room';
import { CustomIcon } from '../../lib/Icons';
import categories from './categories';
import {isEqual} from 'lodash';

const scrollProps = {
	keyboardShouldPersistTaps: 'always',
	keyboardDismissMode: 'none'
};

class EmojiPicker extends Component {
	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		userEmojis: PropTypes.array,
		customEmojis: PropTypes.array,
		onEmojiSelected: PropTypes.func,
		showAddEmojiModal: PropTypes.func,
		tabEmojiStyle: PropTypes.object,
		currentCustomEmoji: PropTypes.string,
		theme: PropTypes.string,
		setCurrentCustomEmoji: PropTypes.func,
		isOnlyStandard: PropTypes.bool
	};

	static defaultProps = {
		isOnlyStandard: false
	}

	constructor(props) {
		super(props);
		const customEmojis = props.customEmojis;
		this.state = {
			frequentlyUsed: [],
			customEmojis,
			show: false,
			width: null,
		};
	}

	async componentDidMount() {
		await this.updateFrequentlyUsed();
		this.setState({ show: true });
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { frequentlyUsed, show, width } = this.state;
		const { userEmojis, currentCustomEmoji,  theme } = this.props;

		if (!isEqual(nextProps.userEmojis, userEmojis)) {
			return true;
		}

		if(nextProps.currentCustomEmoji !== currentCustomEmoji){
			return true;
		}

		if (nextProps.theme !== theme) {
			return true;
		}
		if (nextState.show !== show) {
			return true;
		}
		if (nextState.width !== width) {
			return true;
		}
		if (!isEqual(nextState.frequentlyUsed, frequentlyUsed)) {
			return true;
		}
		return false;

	}

	onEmojiSelected = (emoji) => {
		try {
			const { onEmojiSelected } = this.props;
			if (emoji.isCustom) {
				this._addFrequentlyUsed({
					content: emoji.content,
					title: emoji.alias,
					extension: emoji.extension,
					isCustom: true
				});
				onEmojiSelected(`:${ emoji.content }:`);
			} else {
				const content = emoji;
				this._addFrequentlyUsed({ content, isCustom: false });
				const shortname = `:${ emoji }:`;
				onEmojiSelected(shortnameToUnicode(shortname), shortname);
			}
		} catch (e) {
			log(e);
		}
	}

	// eslint-disable-next-line react/sort-comp
	_addFrequentlyUsed = protectedFunction(async(emoji) => {
		const db = database.active;
		const freqEmojiCollection = db.collections.get('frequently_used_emojis');
		let freqEmojiRecord;
		try {
			freqEmojiRecord = await freqEmojiCollection.find(emoji.content);
		} catch (error) {
			// Do nothing
		}

		await db.action(async() => {
			if (freqEmojiRecord) {
				await freqEmojiRecord.update((f) => {
					f.count += 1;
				});
			} else {
				await freqEmojiCollection.create((f) => {
					f._raw = sanitizedRaw({ id: emoji.content }, freqEmojiCollection.schema);
					Object.assign(f, emoji);
					f.count = 1;
				});
			}
		});
	});

	updateFrequentlyUsed = async() => {
		const { isOnlyStandard } = this.props;
		const db = database.active;
		const frequentlyUsedRecords = await db.collections.get('frequently_used_emojis').query().fetch();
		let frequentlyUsed = orderBy(frequentlyUsedRecords, ['count'], ['desc']);
		frequentlyUsed = frequentlyUsed.map((item) => {
			if (item.isCustom) {
				return { content: item.content, title: item.alias, extension: item.extension, isCustom: item.isCustom };
			}
			return shortnameToUnicode(`${ item.content }`);
		});

		if(isOnlyStandard){
			frequentlyUsed = frequentlyUsed.filter(item => !item.isCustom);
		}
		this.setState({ frequentlyUsed });
	};

	onLayout = ({ nativeEvent: { layout: { width, height } } }) => {
		this.setState({ width });
	};

	onClosePreview = () => {
		const { setCurrentCustomEmoji } = this.props;
		setCurrentCustomEmoji(null);
	};

	onClickAddEmoji = () => {
		const { showAddEmojiModal } = this.props;
		showAddEmojiModal(true);
	}

	renderAddEmojiCategoryBtn() {
		const { currentCustomEmoji, theme } = this.props;
		if (currentCustomEmoji) {
			return (
				<BorderlessButton
					key='file-message'
					onPress={this.onClosePreview}
					style={styles.addtionalEmojiBtn}
					testID='add-emoji-actegory-button'
					accessibilityLabel={I18n.t('Add Emoji')}
					accessibilityTraits='button'
				>
					<CustomIcon name='close' style={styles.closePreviewButton} size={24} color={themes[theme].bodyText} />
				</BorderlessButton>
			);
		}
		return (
			<BorderlessButton
				key='file-message'
				onPress={this.onClickAddEmoji}
				style={styles.addtionalEmojiBtn}
				testID='add-emoji-actegory-button'
				accessibilityLabel={I18n.t('Add Emoji')}
				accessibilityTraits='button'
			>
				<CustomIcon name='add' style={styles.addButton} size={24} color={themes[theme].bodyText} />
			</BorderlessButton>
		);
	}

	renderCategory(category, emoji, label, type) {
		const { frequentlyUsed, width } = this.state;
		const { baseUrl, theme } = this.props;
		let isCustomEmojis = false;

		let emojis = [];
		if (type === 0) {
			emojis = frequentlyUsed;
		} else if(type === 1) {
			emojis = emojisByCategory[category];
		} else if(type === 2) {
			emojis = Object.keys(emoji.children)
				.map(item => ({
					content:emoji.children[item].name,
					title:emoji.children[item].alias,
					extension: emoji.children[item].extension,
					isCustom: true
				}));
			isCustomEmojis = true;
			return (
				<EmojiCategory
					key={category}
					tabLabel={label}
					emojis={emojis}
					onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
					style={styles.categoryContainer}
					containerWidth={width}
					baseUrl={baseUrl}
					isCustomEmojis={isCustomEmojis}
					theme={theme}
				/>
			);
		}

		return (
			<EmojiCategory
				key={category}
				tabLabel={label}
				emojis={emojis}
				onEmojiSelected={emoji => this.onEmojiSelected(emoji)}
				style={styles.categoryContainer}
				containerWidth={width}
				baseUrl={baseUrl}
				isCustomEmojis={isCustomEmojis}
				theme={theme}
			/>
		);
	}

	render() {
		const { show, frequentlyUsed, customEmojis } = this.state;
		const { tabEmojiStyle, baseUrl, userEmojis, isOnlyStandard, theme } = this.props;

		if (!show) {
			return null;
		}

		let downloadEmojis = customEmojis.filter(emoji => userEmojis.find(item => item === emoji.id));

		if(isOnlyStandard){
			downloadEmojis = false;
		}

		return (
			<View onLayout={this.onLayout} style={{ flex: 1 }}>
				<ScrollableTabView
                    renderTabBar={() => <TabBar tabEmojiStyle={tabEmojiStyle} theme={theme} hasFrequency={frequentlyUsed.length !== 0} hasAddtionalBtn={!isOnlyStandard}/>}
					contentProps={scrollProps}
					style={{ backgroundColor: themes[theme].focusedBackground }}
				>
					{ (frequentlyUsed.length !== 0) ? this.renderCategory(frequentlyUsed, 0, '🕒', 0) : null}
					{
						(downloadEmojis)?downloadEmojis.map((pEmoji, i) => this.renderCategory(pEmoji.name, pEmoji, <CustomEmoji baseUrl={ baseUrl } style={ styles.tabCustomEmoji } emoji={ pEmoji }/>, 2)) : null
					}
					{
						categories.tabs.map((tab, i) => this.renderCategory(tab.category, 0, tab.tabLabel, 1))
					}
				</ScrollableTabView>
				{ isOnlyStandard ? null : this.renderAddEmojiCategoryBtn() }
			</View>
		);
	}
}

const mapStateToProps = state => ({
	userEmojis: state.login.user.emojis,
	customEmojis: state.customEmojis,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
	currentCustomEmoji: state.room.currentCustomEmoji
});

const mapDispatchToProps = dispatch => ({
	showAddEmojiModal: (isShowingAddEmoji) => dispatch(setShowingAddEmojiModal(isShowingAddEmoji)),
	setCurrentCustomEmoji: (emoji) => dispatch(setCurrentCustomEmojiAction(emoji))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(EmojiPicker));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, FlatList, BackHandler, Keyboard, PermissionsAndroid
} from 'react-native';
import ShareExtension from 'rn-extensions-share';
import * as FileSystem from 'expo-file-system';
import { connect } from 'react-redux';
import * as mime from 'react-native-mime-types';
import { isEqual } from 'lodash';
import { Q } from '@nozbe/watermelondb';

import database from '../../lib/database';
import {isAndroid, isIOS} from '../../utils/deviceInfo';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import log from '../../utils/log';
import * as HeaderButton from '../../containers/HeaderButton';
import ShareListHeader from './Header';
import ActivityIndicator from '../../containers/ActivityIndicator';

import styles from './styles';
import { themes } from '../../constants/colors';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { withTheme } from '../../theme';
import RoomItem, { ROW_HEIGHT } from '../../presentation/RoomItem';
import RocketChat from '../../lib/rocketchat';
import SearchBox from '../../containers/SearchBox';
import debounce from '../../utils/debounce';
import {MAX_SIDEBAR_WIDTH} from "../../constants/tablet";
import {withDimensions} from "../../dimensions";
import {sanitizeLikeString} from "../../lib/database/utils";

const LIMIT = 50;
const getItemLayout = (data, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index });
const keyExtractor = item => item.rid;

class ShareListView extends React.Component {

	static propTypes = {
		navigation: PropTypes.object,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string
		}),
		isMasterDetail: PropTypes.bool,
		server: PropTypes.string,
		token: PropTypes.string,
		userId: PropTypes.string,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		FileUpload_MediaTypeWhiteList: PropTypes.string,
		FileUpload_MaxFileSize: PropTypes.number,
		useRealName: PropTypes.bool,
		StoreLastMessage: PropTypes.bool,
		width: PropTypes.number,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.data = [];
		this.state = {
			showError: false,
			searching: false,
			searchText: '',
			value: '',
			isMedia: false,
			mediaLoading: false,
			isCompressing: false,
			fileInfo: null,
			searchResults: [],
			chats: [],
			servers: [],
			loading: true,
			serverInfo: null
		};
		this.unsubscribeFocus = props.navigation.addListener('focus', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.unsubscribeBlur = props.navigation.addListener('blur', () => BackHandler.addEventListener('hardwareBackPress', this.handleBackPress));
		this.setHeader();
	}

	async componentDidMount() {
		try {
			let data = await ShareExtension.data();
			if (isAndroid) {
				await this.askForPermission(data);
			}
			const info = await Promise.all(data.filter(item => item.type === 'media').map(file => FileSystem.getInfoAsync(this.uriToPath(file.value), { size: true })));
			const attachments = info.map(file => ({
				filename: decodeURIComponent(file.uri.substring(file.uri.lastIndexOf('/') + 1)),
				description: '',
				size: file.size,
				mime: mime.lookup(file.uri),
				path: file.uri
			}));
			const text = data.filter(item => item.type === 'text').reduce((acc, item) => `${ item.value }\n${ acc }`, '');
			this.setState({
				text,
				attachments
			});
		} catch (e) {
			log(e);
			this.setState({ mediaLoading: false });
		}

		this.getSubscriptions();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { searching, needsPermission } = this.state;
		if (nextState.searching !== searching) {
			return true;
		}
		if (nextState.needsPermission !== needsPermission) {
			return true;
		}

		const {
			cards,
			selected,
			selectAll,
			theme
		} = this.props;

		const { isMedia } = this.state;
		if (nextState.isMedia !== isMedia) {
			return true;
		}

		if (cards !== nextProps.cards) {
			return true;
		}

		if (selected !== nextProps.selected) {
			return true;
		}

		if (selectAll !== nextProps.selectAll) {
			return true;
		}
		if (theme !== nextProps.theme) {
			return true;
		}

		const { searchResults } = this.state;
		if (!isEqual(nextState.searchResults, searchResults)) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps, prevState) {
		const {
			cards,
			selected,
			selectAll,
		} = this.props;

		const{ searchText } = this.state;

		if (
			!(
				(prevProps.cards === cards)
				&& (prevProps.selected === selected)
				&& (prevProps.selectAll === selectAll)
			)
		) {
			this.getSubscriptions();
			if(searchText.trim().length > 0){
				this.search(searchText);
			}
		}
	}

	componentWillUnmount() {
		if (this.unsubscribeFocus) {
			this.unsubscribeFocus();
		}
		if (this.unsubscribeBlur) {
			this.unsubscribeBlur();
		}
	}

	setHeader = () => {
		const { navigation, theme } = this.props;

		navigation.setOptions({
			headerLeft: () => <HeaderButton.Drawer navigation={navigation} onPress={ this.openDrawer } testID='share-list-view-sidebar' />,
			headerTitle: () => <ShareListHeader theme={theme} navigation={navigation}/>,
			headerRight: () =>
				<HeaderButton.CancelModal
					onPress={ShareExtension.close}
					testID='share-extension-close'
				/>
		});
	};

	openDrawer = () => {
		const { navigation } = this.props;
		Keyboard.dismiss();
		navigation.navigate('ShareSidebarView');
	};

	// eslint-disable-next-line react/sort-comp
	internalSetState = (...args) => {
		const { navigation } = this.props;
		if (navigation.isFocused()) {
			animateNextTransition();
		}
		this.setState(...args);
	};

	query = (text) => {
		const {selected} = this.props;
		const db = database.active;
		let defaultWhereClause = [
			Q.where('archived', false),
			Q.where('open', true),
			Q.experimentalSkip(0),
			Q.experimentalTake(50),
			Q.experimentalSortBy('room_updated_at', Q.desc)
		];

		if(selected?._id){
			defaultWhereClause.push(Q.where('cardId', selected._id));
		}

		if (text) {
			const likeString = sanitizeLikeString(text);
			return db.collections
				.get('subscriptions')
				.query(
					...defaultWhereClause,
					Q.or(
						Q.where('name', Q.like(`%${ likeString }%`)),
						Q.where('fname', Q.like(`%${ likeString }%`))
					)
				).fetch();
		}
		return db.collections.get('subscriptions').query(...defaultWhereClause).fetch();
	}
	getSubscriptions = async() => {
		this.chats = await this.query();
		this.internalSetState({
			chats: this.chats ?? [],
			loading: false,
		});

		this.forceUpdate();
	};

	getRoomTitle = (item) => item.fname || item.name;

	getRoomAvatar = item => RocketChat.getRoomAvatar(item)

	isGroupChat = item => RocketChat.isGroupChat(item)

	getUidDirectMessage = room => RocketChat.getUidDirectMessage(room);

	getName(cardId) {
		const { cards } = this.props;
		const target = cards.find(card => (card._id === cardId));
		if (!target) {
			return null;
		}
		return target.name;
	}

	askForPermission = async(data) => {
		const mediaIndex = data.findIndex(item => item.type === 'media');

		if (mediaIndex !== -1) {
			const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, {
				title: I18n.t('Read_External_Permission'),
				message: I18n.t('Read_External_Permission_Message')
			});
			if (result !== PermissionsAndroid.RESULTS.GRANTED) {
				this.setState({ needsPermission: true });
				return Promise.reject();
			}
		}
		this.setState({ needsPermission: false });
		return Promise.resolve();
	}

	uriToPath = uri => decodeURIComponent(isIOS ? uri.replace(/^file:\/\//, '') : uri);

	shareMessage = (item) => {
		const { attachments, text } = this.state;
		const { navigation } = this.props;

		navigation.navigate('ShareView', {
			room: {
				rid: item.rid,
				name: this.getRoomTitle(item),
				c: item.c,
				u: item.u,
				o: item.o,
				t: item.t,
				blocked: item.blocked,
				blocker: item.blocker,
				cardId: item.cardId
			},
			text,
			attachments,
		});
	}

	search = debounce(async (text) => {
		const result = await this.query(text);
		this.setState({
			searchResults: result,
			searchText: text,
			searching: !!text.length
		});
	}, 500);

	cancelSearch = () => {
		this.internalSetState({ searching: false, searchResults: [], searchText: '' });
		this.inputRef.clear();
		Keyboard.dismiss();
	}

	handleBackPress = () => {
		const { searching } = this.state;
		if (searching) {
			this.cancelSearch();
			return true;
		}
		return false;
	}

	renderSectionHeader = (header) => {
		const { searching } = this.state;
		const { theme } = this.props;
		if (searching) {
			return null;
		}

		return (
			<View style={[styles.headerContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<Text style={[styles.headerText, { color: themes[theme].titleText }]}>
					{I18n.t(header)}
				</Text>
			</View>
		);
	}

	renderItem = ({ item }) => {
		if (item.separator) {
			return this.renderSectionHeader(item.rid);

		}

		const {
			user: {username},
			StoreLastMessage,
			useRealName,
			theme,
			isMasterDetail,
			width,
			selectAll
		} = this.props;

		const id = this.getUidDirectMessage(item);

		return (
			<RoomItem
				item={item}
				theme={theme}
				id={id}
				type={item.t}
				key={item._id}
				username={username}
				showLastMessage={StoreLastMessage}
				onPress={() => this.shareMessage(item)}
				testID={`rooms-list-view-item-${ item.name }`}
				width={isMasterDetail ? MAX_SIDEBAR_WIDTH : width}
				useRealName={useRealName}
				swipeEnabled={false}
				showStatus={false}
				getRoomTitle={this.getRoomTitle}
				getRoomAvatar={this.getRoomAvatar}
				getIsGroupChat={this.isGroupChat}
				visitor={item.visitor}
				selectAll={selectAll}
			/>
		);
	}

	renderSeparator = () => {
		const { theme } = this.props;
		return <View style={[styles.separator, { borderColor: themes[theme].separatorColor }]} />;
	}

	renderBorderBottom = () => {
		const { theme } = this.props;
		return <View style={[styles.borderBottom, { borderColor: themes[theme].separatorColor }]} />;
	}

	renderEmptyComponent = () => {
		const { theme } = this.props;
		return (
			<View style={[styles.container, styles.emptyContainer, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t('No_results_found')}</Text>
			</View>
		);
	}

	getInputRef = ref => (this.inputRef = ref);

	searchSubmit = (event) => {
		Keyboard.dismiss();
		this.search(event.nativeEvent.text);
	}

	renderHeader = () => {
		const { searching } = this.state;
		return <SearchBox inputRef={ this.getInputRef } onChangeText={this.search} onSubmitEditing={this.searchSubmit} testID='share-list-view-search' key='share-list-view-search' hasCancel={searching} onCancelPress={this.cancelSearch}/>;
	}

	renderContent = () => {
		const {
			chats, mediaLoading, loading, searchResults, searching, searchText, isCompressing
		} = this.state;
		const { theme } = this.props;

		if (mediaLoading || loading || isCompressing) {
			return <ActivityIndicator theme={theme} />;
		}

		return (
			<FlatList
				data={searching ? searchResults : chats}
				extraData={searching ? searchResults : chats}
				keyExtractor={keyExtractor}
				style={styles.flatlist}
				renderItem={this.renderItem}
				getItemLayout={getItemLayout}
				ItemSeparatorComponent={this.renderSeparator}
				enableEmptySections
				removeClippedSubviews
				keyboardShouldPersistTaps='always'
				initialNumToRender={12}
				windowSize={20}
			/>
		);
	}

	renderError = () => {
		const {
			fileInfo: file, loading, searching, error
		} = this.state;
		const { theme } = this.props;

		if (loading) {
			return <ActivityIndicator theme={theme} />;
		}

		return (
			<View style={[styles.container, { backgroundColor: themes[theme].auxiliaryBackground }]}>
				<View style={[styles.container, styles.centered, { backgroundColor: themes[theme].auxiliaryBackground }]}>
					<Text style={[styles.title, { color: themes[theme].titleText }]}>{I18n.t(error)}</Text>
					<CustomIcon name='close' size={120} color={themes[theme].dangerColor} />
					<Text style={[styles.fileMime, { color: themes[theme].titleText }]}>{ file.mime }</Text>
				</View>
			</View>
		);
	}

	render() {
		const { showError } = this.state;
		const { theme } = this.props;
		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} forceInset={{ vertical: 'never' }}>
				{this.renderHeader()}
				{ showError ? this.renderError() : this.renderContent() }
			</View>
		);
	}
}

const mapStateToProps = (state => ({
	user: {
		id: state.share.user && state.share.user.id,
		username: state.share.user && state.share.user.username,
		token: state.share.user && state.share.user.token
	},
	isMasterDetail: state.app.isMasterDetail,
	server: state.share.server,
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	FileUpload_MediaTypeWhiteList: state.share.settings.FileUpload_MediaTypeWhiteList,
	FileUpload_MaxFileSize: state.settings.FileUpload_MaxFileSize,
	useRealName: state.share.settings.UI_Use_Real_Name,
	StoreLastMessage: state.share.settings.Store_Last_Message,
}));

export default connect(mapStateToProps)(withDimensions(withTheme(ShareListView)));

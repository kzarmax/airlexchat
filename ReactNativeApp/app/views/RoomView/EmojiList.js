import React from 'react';
import { FlatList, ScrollView, Text, TouchableWithoutFeedback, View } from 'react-native';
import PropTypes from 'prop-types';

import styles from './styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import { isIOS } from '../../utils/deviceInfo';
import { animateNextTransition } from '../../utils/layoutAnimation';
import { connect } from 'react-redux';
import CustomEmoji from '../../containers/EmojiPicker/CustomEmoji';
import I18n from '../../i18n';
import { CustomIcon } from '../../lib/Icons';
import { showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import RCActivityIndicator from '../../containers/ActivityIndicator';
import log from '../../utils/log';
import equal from 'deep-equal';
import { themes } from '../../constants/colors';

class EmojiList extends React.Component {
	static propTypes = {
		userEmojis: PropTypes.array,
		allEmojis: PropTypes.array,
		baseUrl: PropTypes.string,
		listRef: PropTypes.func,
		navigation: PropTypes.object,
		window: PropTypes.object,
		theme: PropTypes.string,
	};

	constructor(props) {
		super(props);
		console.time(`${ this.constructor.name } init`);
		console.time(`${ this.constructor.name } mount`);

		this.mounted = false;
		this.state = {
			processing: false,
			processing_id: 0,
			animated: false,
		};

		console.timeEnd(`${ this.constructor.name } init`);
	}

	componentDidMount() {
		this.mounted = true;
		console.timeEnd(`${ this.constructor.name } mount`);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { processing } = this.state;
		const { userEmojis, window, theme } = this.props;
		if (theme !== nextProps.theme) {
			return true;
		}
		if(processing !== nextState.processing){
			return true;
		}
		if(!equal(userEmojis, nextProps.userEmojis)){
			return true;
		}
		if(!equal(window, nextProps.window)){
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

	downloadEmoji = async(id) => {
		this.setState({processing: true, processing_id: id});
		try{
			const result = await RocketChat.downloadEmoji(id);
			if(result.success){
				showToast(I18n.t('Success_download_emoji'));
			} else {
				showToast(I18n.t('err_download_emoji'));
			}
		}catch(e){
			log(e);
			showToast(I18n.t('err_download_emoji'));
		}
		this.setState({processing: false});
	};

	removeEmoji = async(id) => {
		this.setState({processing: true, processing_id: id});
		try{
			const result = await RocketChat.removeEmojiFromUser(id);
			if(result.success){
				showToast(I18n.t('Success_download_emoji'));
			} else {
				showToast(I18n.t('err_download_emoji'));
			}
		}catch(e){
			log(e);
			showToast(I18n.t('err_download_emoji'));
		}
		this.setState({processing: false});
	};

	renderItem = ({ item, index }) => {
		const { processing, processing_id } = this.state;
		const { baseUrl, userEmojis, theme } = this.props;
		const childEmojis =  Object.keys(item.children)
			.map(index => ({
				content:item.children[index].name,
				title:item.children[index].alias,
				extension: item.children[index].extension,
				isCustom: true
			}));

		const isDownloading = ( processing && item.id === processing_id) ;
		const isDownloaded = userEmojis.find(emojiId => emojiId === item.id);

		return (
			<View style={styles.emojiContainer}>
				<View style={{ flexGrow: 1, width: '80%' }}>
					<View style={{ flexDirection:'row' }}>
						<CustomEmoji baseUrl={ baseUrl } style={ styles.titleEmoji } emoji={ item }/>
						<Text style={{ ...styles.emojiTitle, color: themes[theme].bodyText }}>{item.name}</Text>
						{ isDownloaded ? <CustomIcon name='check' size={ 24 } color={ '#0576ff' }/> : null }
					</View>
					<ScrollView horizontal={true} showsHorizontalScrollIndicator={false} {...scrollPersistTaps} contentContainerStyle={styles.emojisContainer}>
						{childEmojis.map((emoji, i) => <CustomEmoji baseUrl={ baseUrl } style={ styles.customEmoji } emoji={ emoji }/>)}
					</ScrollView>
				</View>
				<View style={ styles.downloadEmojiBtn }>
					{
						isDownloaded ?
						<TouchableWithoutFeedback
							key={ 'download_emoji' }
							onPress={ () => this.removeEmoji(item.id) }>
							{ isDownloading ? <RCActivityIndicator style={ {
									padding: 0,
									flex: 0
								} } color={ '#0576ff' }/> :
								<CustomIcon name='close' size={ 24 } color={ 'red' }/> }
						</TouchableWithoutFeedback>
						:
						<TouchableWithoutFeedback
							key={ 'download_emoji' }
							onPress={ () => this.downloadEmoji(item.id) }>
							{ isDownloading ? <RCActivityIndicator style={ {
									padding: 0,
									flex: 0
								} } color={ '#0576ff' }/> :
								<CustomIcon name='download' size={ 24 } color={ '#0576ff' }/> }
						</TouchableWithoutFeedback>
					}
				</View>
			</View>
		);
	};

	render() {
		const { listRef, allEmojis, window } = this.props;

		return (
			<>
				<FlatList
					testID='room-view-messages'
					ref={listRef}
					keyExtractor={item => item.name}
					data={allEmojis}
					extraData={this.state}
					renderItem={this.renderItem}
					contentContainerStyle={styles.emojiContentContainer}
					style={[styles.emojiList, window.width > window.height && {marginBottom: 48}]}
					removeClippedSubviews={isIOS}
					showsVerticalScrollIndicator={false}
					initialNumToRender={7}
					maxToRenderPerBatch={5}
					windowSize={10}
					{...scrollPersistTaps}
				/>
			</>
		);
	}
}

const mapStateToProps = state => ({
	userEmojis: state.login.user && state.login.user.emojis,
	allEmojis: state.customEmojis,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
});

export default connect(mapStateToProps, null)(EmojiList);

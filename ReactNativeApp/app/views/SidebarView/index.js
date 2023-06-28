import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	ScrollView,
	Text,
	View,
	SafeAreaView,
	Image
} from 'react-native';
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';
import SortableList from 'react-native-sortable-list';

import { isEqual } from 'lodash';

import {
	setCards as setCardsAction, selectOne as selectOneAction, selectAllCard as selectAllCardAction
} from '../../actions/cards';
import Avatar from '../../containers/Avatar';

import log, { LOG_L_LOW } from '../../utils/log';
import I18n from '../../i18n';
import scrollPersistTaps from '../../utils/scrollPersistTaps';

import styles from './styles';
import SidebarItem from './SidebarItem';
import Button from '../../containers/Button';
import { showToast } from '../../utils/info';
import RocketChat from '../../lib/rocketchat';
import {withTheme} from "../../theme";

class Sidebar extends Component {
	static propTypes = {
		baseUrl: PropTypes.string,
		navigation: PropTypes.object,
		user: PropTypes.object,
		cards: PropTypes.array,
		selected: PropTypes.object,
		selectAll: PropTypes.bool,
		setCards: PropTypes.func.isRequired,
		selectOneCard: PropTypes.func.isRequired,
		selectAllCardState: PropTypes.func.isRequired,
		activeItemKey: PropTypes.string,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
			showSort: false,
			changeKey: null,
			changeList: null
		};
	}

	shouldComponentUpdate(nextProps, nextSate) {
		const { cards, selected, selectAll, theme } = this.props;
		const { showSort } = this.state;
		if (!isEqual(nextProps.cards, cards)) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!isEqual(nextProps.selected, selected)) {
			return true;
		}
		if (nextProps.selectAll !== selectAll) {
			return true;
		}
		if (nextSate.showSort !== showSort) {
			return true;
		}

		return false;
	}

	componentDidUpdate(nextProps) {
		const { cards, selected, selectAll } = this.props;
		if (!isEqual(nextProps.cards, cards)) {
			// 何か変更する場合の処理
		}
		if (!isEqual(nextProps.selected, selected)) {
			// 何か変更する場合の処理
		}
		if (nextProps.selectAll !== selectAll) {
			// 何か変更する場合の処理
		}
	}

	// カード切り替え処理
	selectCards = async(card) => {
		const { selected, selectAll } = this.props;
		if(!selectAll && card._id === selected._id)
			return;
		const { selectOneCard, navigation } = this.props;
		if(card.isSecret){
			navigation.navigate('OpenSecretCardView', {cardId: card._id});
		}
		else{
			selectOneCard({id: card._id, callback: ()=>{
				showToast(I18n.t('change_card_true'));
			}});
		}
	}

	// カード切り替え処理（全選択）
	selectAllCards = async() => {
		const { selectAllCardState } = this.props;
		await selectAllCardState(true);
		showToast(I18n.t('change_card_true'));
	}

	// カード一覧の描画
	renderCards = () => {
		const {
			cards, selectAll
		} = this.props;
		const { showSort } = this.state;
		const rows = [];

		if (!showSort) {
			// カード一覧表示
			if (cards.length) {
				cards.forEach((card) => {
					if (card.name) {
						const { _id, name } = card;
						let { active } = card;
						// 全てのカード選択時はアクティブ表現をOFF（DB上ではどれか１枚のカードが選択されている状態）
						if (selectAll) {
							active = false;
						}
						rows.push(
							<SidebarItem
								key={`sidebar-view-key-${ _id }`}
								text={name}
								left={(
									<Avatar
										key={`sidebar-view-avatar-${ _id }`}
										borderRadius={6}
										type='ci'
										text={_id}
										size={40}
									/>
								)}
								onPress={() => this.selectCards(card)}
								testID={`sidebar-view-item-${ _id }`}
								current={active}
								showSort={showSort}
							/>
						);
					}
				});
			}
			// 全てのカードの追加
			let activeAll = false;
			if (selectAll) {
				activeAll = true;
			}
			rows.push(
				<SidebarItem
					key='sidebar-view-key-all'
					text={I18n.t('All_Card')}
					left={(
						<Image style={styles.card_all} source={{ uri: 'card_all' }} />
					)}
					onPress={this.selectAllCards}
					testID='sidebar-view-item-all'
					current={activeAll}
					showSort={showSort}
				/>
			);
		} else {
			// カード並びかえ表示
			rows.push(
				<SortableList
					data={cards}
					renderRow={ (card) => this.sortItem(card) }
					onReleaseRow={(key, currentOrder) => this.changeList(key, currentOrder)}
					scrollEnabled={false}
				/>
			);
		}
		return rows;
	}

	// ソート対象のカードを表示
	sortItem = (items) => {
		const card = items.data;
		const { showSort } = this.state;
		return (
			<SidebarItem
				key={`sidebar-view-key-${ card._id }`}
				text={card.name}
				left={(
					<Avatar
						key={`sidebar-view-avatar-${ card._id }`}
						borderRadius={6}
						type='ci'
						text={card._id}
						size={40}
					/>
				)}
				testID={`sidebar-view-item-${ card._id }`}
				showSort={showSort}
			/>
		);
	}

	// 並び替えしたリストを取得
	changeList = (key, currentOrder) => {
		this.setState({
			changeKey: key,
			changeList: currentOrder
		});
	}

	// 並び替え決定ボタンをクリック
	setSortList = async() => {
		const { changeList } = this.state;
		const { cards, setCards } = this.props;

		if(!changeList)
			return;
		let c = changeList;
		let _cards = cards;
		if (Object.keys(c).length) {
			for (let i = 0; i < Object.keys(c).length; i++) {
				_cards[c[i]].order = i;
			}
		}

		// todo : when first set cards,  occur "Invariant Violation" error
		let result = null;
		try {
			result = await RocketChat.setCardOrders(_cards);
			if (result && result.success) {
				// 最新のカード一覧を設定する
				LOG_L_LOW('cards: ', result.cards);
				setCards(result.cards);

				this.toggleSort();
				showToast(I18n.t('CardsListChange'));

			}
		} catch (e) {
			if(e.name === 'Invariant Violation' && result && result.cards)
			{
				setCards(result.cards);
				this.toggleSort();
				showToast(I18n.t('CardsListChange'));
			}
			log(e);
		}

	};

	// 画面遷移
	sidebarNavigate = (route) => {
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	// カードの並び替え ON/OFF
	toggleSort = () => {
		const { showSort } = this.state;

		this.setState({
			showSort: !showSort
		});
	}

	render() {
		// const { cards } = this.state;
		const { user, theme } = this.props;
		const { showSort } = this.state;

		if (!user) {
			return null;
		}
		return (
			<SafeAreaView testID='sidebar-view' style={styles.container}>
				<View style={styles.header}>
					<View style={styles.headerTextContainer}>
						<Text style={styles.currentServerText} numberOfLines={1}>{I18n.t('Side_Bar')}</Text>
					</View>
					<RectButton
						onPress={this.toggleSort}
						// underlayColor='#292E35'
						// activeOpacity={0.1}
						testID='sidebar-toggle-sort'
						// style={styles.btn_sort_1}
					>
						<Image
							style={styles.btn_sort_1}
							source={{ uri: 'btn_sort_1' }}
							onPress={() => this.toggleSort()}
						/>
					</RectButton>
				</View>
				<ScrollView style={styles.containerArea} {...scrollPersistTaps}>
					<React.Fragment>
						{this.renderCards()}
					</React.Fragment>
				</ScrollView>
				<View style={styles.newBtnArea}>
					<Button
						onPress={() => this.sidebarNavigate('NewCardView')}
						testID='sidebar-btn'
						type='primary'
						text={I18n.t('CardAdd')}
						size='w'
						icon='plus'
						hidden={showSort}
						textColor={'white'}
						theme={theme}
					/>
					<Button
						onPress={this.setSortList}
						testID='sidebar-btn2'
						type='primary'
						text={I18n.t('Done')}
						size='w'
						hidden={!showSort}
						textColor={'white'}
						theme={theme}
					/>
				</View>
			</SafeAreaView>
		);
	}
}


const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		language: state.login.user && state.login.user.language,
		status: state.login.user && state.login.user.status,
		username: state.login.user && state.login.user.username,
		token: state.login.user && state.login.user.token
	},
	cards: state.cards && state.cards.cards,
	selected: state.cards && state.cards.selected,
	selectAll: state.cards && state.cards.selectAll,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

const mapDispatchToProps = dispatch => ({
	setCards: cards => dispatch(setCardsAction(cards)),
	selectOneCard: params => dispatch(selectOneAction(params)),
	selectAllCardState: () => dispatch(selectAllCardAction(true))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(Sidebar));

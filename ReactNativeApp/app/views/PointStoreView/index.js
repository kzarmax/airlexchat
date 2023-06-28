import React from 'react';
import PropTypes from 'prop-types';
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { connect } from 'react-redux';
import orderBy from 'lodash/orderBy';

import I18n from '../../i18n';

import styles from './styles';
import { withTheme } from '../../theme';
import equal from 'deep-equal';
import { themes } from '../../constants/colors';

class PointStoreView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Point_Store')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		pointProfiles: PropTypes.array.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			name: PropTypes.string,
			username: PropTypes.string,
			points: PropTypes.number
		}),
		navigation: PropTypes.object,
		theme: PropTypes.string
	};

	constructor(props) {
		super(props);
		this.state = {
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { user, theme } = this.props;
		if(!equal(user, nextProps.user)){
			return true;
		}
		return theme !== nextProps.theme;
	}

	keyExtractor = item => item.rid;

	getScrollRef = ref => this.scroll = ref;

	renderSeparator = () => <View style={styles.separator} />;

	onPurchase = (profile) => {
		const { navigation } = this.props;
		navigation.navigate('PointPurchaseView', {profile});
	};

	// 1項目の表示内容設定
	renderItem = ({ item }) => {
		const { theme } = this.props;
		return (
			<View style={styles.itemContainer}>
				<View style={styles.pointContainer}>
					<Image style={styles.coinIcon} source={{ uri: 'icon_coin' }} />
					<Text style={{ ...styles.point, color: themes[theme].bodyText }}>{item.points}pt</Text>
				</View>
				<Text style={{ ...styles.pointText, color: themes[theme].bodyText }}>{item.text}</Text>
				<TouchableOpacity
					style={ styles.purchaseBtn }
					onPress={() => this.onPurchase(item)}
					testID='onPurchase'
				>
					<Text style={styles.btnLabel}>¥{item.price.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</Text>
				</TouchableOpacity>
			</View>
		);
	}


	getByPoints = (allProfiles) => {
		if (!allProfiles.length) {
			return null;
		}
		return orderBy(allProfiles.filter(item => item.points !== null), ['points'], ['desc']);
	};

	render() {
		const { pointProfiles, user, theme } = this.props;
		const ordered_profiles = this.getByPoints(pointProfiles);
		let view_data = [];
		if(ordered_profiles){
			const min_profile = ordered_profiles[ordered_profiles.length-1];
			view_data = ordered_profiles.map(item => {
				const profit = (item.points * min_profile.price/min_profile.points - item.price).toFixed(2);
				const label = min_profile.points === item.points || !profit ? '' : `¥${profit.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")} お得!`;
				return {
					points: item.points,
					text: label,
					price: item.price
				};
			});
		}

		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='point-store-container'>
				<View style={styles.headerContainer}>
					<Text style={{ ...styles.headerTitle, color: themes[theme].bodyText }}>{I18n.t('Purchase_Point')}</Text>
					<View style={styles.stockContainer}>
						<Text style={{ ...styles.pointLabel, color: themes[theme].bodyText }}>{I18n.t('Point_Stock')}</Text>
						<Image style={styles.titleCoinIcon} source={{ uri: 'icon_coin' }} />
						<Text style={{ ...styles.headerPoint, color: themes[theme].bodyText}}>{ user.points }pt</Text>
					</View>
				</View>
				<View style={styles.bodyTitle}>
					<Text style={{ color: themes[theme].bodyText }}>{I18n.t('Please_Select_Point_Card')}</Text>
				</View>
				<View>
					<FlatList
						ref={this.getScrollRef}
						data={view_data}
						extraData={view_data}
						keyExtractor={this.keyExtractor}
						style={styles.list}
						renderItem={this.renderItem}
						ItemSeparatorComponent={this.renderSeparator}
						enableEmptySections
						removeClippedSubviews
					/>
				</View>
			</View>
		);
	}
}


const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		points: state.login.user && state.login.user.points,
	},
	pointProfiles: state.pointProfiles,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});
const mapDispatchToProps = dispatch => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(PointStoreView));

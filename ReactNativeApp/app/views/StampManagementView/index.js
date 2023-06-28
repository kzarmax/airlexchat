import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, Text, View } from 'react-native';
import { connect } from 'react-redux';

import sharedStyles from '../Styles';
import I18n from '../../i18n';
import { setUser as setUserAction } from '../../actions/login';
import styles from './styles';
import StampItem from './StampItem';
import equal from 'deep-equal';
import {withTheme} from "../../theme";
import { themes } from '../../constants/colors';

class StampManagementView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Stamp_Management')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		user: PropTypes.shape({
			id: PropTypes.string,
			username: PropTypes.string,
			token: PropTypes.string,
			emojis: PropTypes.array,
		}),
		navigation: PropTypes.object,
		customEmojis: PropTypes.array,
		theme: PropTypes.string
	}

	constructor(props) {
		super(props);
		this.state = {
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { user, customEmojis } = this.props;
		if( !equal(user.emojis, nextProps.user.emojis)){
			return true;
		}
		if( !equal(customEmojis, nextProps.customEmojis)){
			return true;
		}
	}

	componentDidUpdate(prevProps) {

	}

	onCategoryPress = (category) => {
		const { user, navigation } = this.props;
		const is_downloaded = user.emojis.includes(category.id);
		navigation.navigate('StampEditView', { category, is_downloaded });
	};

	onViewAll = (categories, title) => {
		const { navigation } = this.props;
		navigation.navigate('StampCategoriesView', {categories, title});
	};

	renderStamps(){
		const { baseUrl, customEmojis, user, theme } = this.props;
		const publicEmojis = customEmojis
			.map(item => ({
				id: item.id,
				content:item.name,
				title:item.alias,
				creator: item.creator,
				points: item.points,
				extension: item.extension,
				children: item.children,
				isCustom: true
			}));
		const recommendedEmojis = publicEmojis.filter(item => !user.emojis.includes(item.id));
		const freePublicEmojis = publicEmojis.filter(item => !item.points);
		const popularPublicEmojis = publicEmojis.filter(item => item.points > 0);
		return (
			<View>
				{
					recommendedEmojis.length?
						<StampItem
							title={I18n.t('Recommended_Stamps')}
							onPress={this.onCategoryPress}
							onViewAll={() => this.onViewAll(recommendedEmojis, I18n.t('Recommended_Stamps'))}
							baseUrl={baseUrl}
							emojis={recommendedEmojis}
							theme={theme}
						/>
						:
						null
				}
				<View style={styles.separator}/>
				{
					popularPublicEmojis.length?
						<StampItem
							title={I18n.t('Popular_Public_Stamps')}
							onPress={this.onCategoryPress}
							onViewAll={() => this.onViewAll(popularPublicEmojis, I18n.t('Popular_Public_Stamps'))}
							baseUrl={baseUrl}
							emojis={popularPublicEmojis}
							theme={theme}
						/>
						:
						null
				}
				{
					freePublicEmojis.length?
						<StampItem
							title={I18n.t('Free_Public_Stamps')}
							onPress={this.onCategoryPress}
							onViewAll={() => this.onViewAll(freePublicEmojis, I18n.t('Free_Public_Stamps'))}
							baseUrl={baseUrl}
							emojis={freePublicEmojis}
							theme={theme}
						/>
						:
						null
				}

			</View>
		);
	}

	render() {
		const { theme } = this.props;
		return (
			<View style={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }} testID='qr-card_select-swipe'>
				<ScrollView style={styles.scrollView}>
					{this.renderStamps()}
				</ScrollView>
				{/*<View style={styles.btnArea}>*/}
				{/*	<Button*/}
				{/*		testID='sidebar-toggle-status'*/}
				{/*		type='primary'*/}
				{/*		text={I18n.t('Add_Original_Stamp')}*/}
				{/*		size='w'*/}
				{/*		onPress={() => {}}*/}
				{/*	/>*/}
				{/*</View>*/}
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
		emojis: state.login.user && state.login.user.emojis,
	},
	customEmojis: state.customEmojis,
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : '',
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(StampManagementView));

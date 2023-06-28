import React from 'react';
import PropTypes from 'prop-types';
import {
	View, ScrollView, Text, Image
} from 'react-native';
import { connect } from 'react-redux';

import KeyboardView from '../../presentation/KeyboardView';
import sharedStyles from '../Styles';
import scrollPersistTaps from '../../utils/scrollPersistTaps';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import Loading from '../../containers/Loading';
import { showErrorAlert, showToast } from '../../utils/info';
import log, {events, logEvent} from '../../utils/log';
import { setUser as setUserAction } from '../../actions/login';
import StatusBar from '../../containers/StatusBar';
import styles from './styles';
import Slider from '@react-native-community/slider';
import * as List from "../../containers/List";
import UserPreferences from "../../lib/userPreferences";
import RocketChat, {THEME_PREFERENCES_KEY} from "../../lib/rocketchat";
import {themes} from "../../constants/colors";
import {supportSystemTheme} from "../../utils/deviceInfo";
import {withTheme} from "../../theme";
import equal from 'deep-equal';

const THEME_GROUP = 'THEME_GROUP';
const DARK_GROUP = 'DARK_GROUP';

const SYSTEM_THEME = {
	label: 'Automatic',
	value: 'automatic',
	group: THEME_GROUP
};

const THEMES = [
	{
		label: 'Light',
		value: 'light',
		group: THEME_GROUP
	}, {
		label: 'Dark',
		value: 'dark',
		group: THEME_GROUP
	}, {
		label: 'Dark',
		value: 'dark',
		group: DARK_GROUP
	}, {
		label: 'Black',
		value: 'black',
		group: DARK_GROUP
	}
];

if (supportSystemTheme()) {
	THEMES.unshift(SYSTEM_THEME);
}

const themeGroup = THEMES.filter(item => item.group === THEME_GROUP);
const darkGroup = THEMES.filter(item => item.group === DARK_GROUP);

class TextSizeView extends React.Component {
	static navigationOptions = {
		title: I18n.t('Theme')
	}

	static propTypes = {
		componentId: PropTypes.string,
		userTextSize: PropTypes.string,
		setUser: PropTypes.func,
		theme: PropTypes.string,
		themePreferences: PropTypes.object,
		setTheme: PropTypes.func
	}

	constructor(props) {
		super(props);
		this.state = {
			textsize: 16,
			saving: false
		};
	}

	componentDidMount() {
		this.getTextSize();
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { textsize, saving } = this.state;
		const { userTextSize, themePreferences, theme } = this.props;
		if (nextState.textsize !== textsize) {
			return true;
		}
		if (nextState.saving !== saving) {
			return true;
		}
		if (nextProps.userTextSize !== userTextSize) {
			return true;
		}
		if (nextProps.theme !== theme) {
			return true;
		}
		if (!equal(nextProps.themePreferences,themePreferences)){
			return true
		}
		return false;
	}

	async getTextSize() {
		try {
			const value = await UserPreferences.getStringAsync(RocketChat.TEXT_SIZE);
			if (value !== null) {
				this.setState({ textsize: Number(value) });
			}
		} catch (error) {
		// エラーになった時の処理
			return 16;
		}
	}

	formIsChanged = () => {
		const { userTextSize } = this.props;
		const { textsize } = this.state;
		return !(Number(userTextSize) === Number(textsize));
	}

	submit = async() => {
		this.setState({ saving: true });

		const { textsize } = this.state;
		const { userTextSize, setUser } = this.props;

		if (!this.formIsChanged()) {
			return;
		}

		const params = {};

		if (userTextSize !== textsize) {
			params.textsize = textsize;
		}

		try {
			await UserPreferences.setStringAsync(RocketChat.TEXT_SIZE, String(params.textsize));
			setUser({ textsize: String(params.textsize) });

			this.setState({ saving: false });
			setTimeout(() => {
				showToast(I18n.t('Preferences_saved'));
			}, 300);
		} catch (e) {
			this.setState({ saving: false });
			setTimeout(() => {
				showErrorAlert(I18n.t('There_was_an_error_while_action', { action: I18n.t('saving_preferences') }));
				log(e);
			}, 300);
		}
	}

	isSelected = (item) => {
		const { themePreferences } = this.props;
		const { group } = item;
		const { darkLevel, currentTheme } = themePreferences;
		if (group === THEME_GROUP) {
			return item.value === currentTheme;
		}
		if (group === DARK_GROUP) {
			return item.value === darkLevel;
		}
	}

	onClick = (item) => {
		const { themePreferences } = this.props;
		const { darkLevel, currentTheme } = themePreferences;
		const { value, group } = item;
		let changes = {};
		if (group === THEME_GROUP && currentTheme !== value) {
			logEvent(events.THEME_SET_THEME_GROUP, { theme_group: value });
			changes = { currentTheme: value };
		}
		if (group === DARK_GROUP && darkLevel !== value) {
			logEvent(events.THEME_SET_DARK_LEVEL, { dark_level: value });
			changes = { darkLevel: value };
		}
		this.setTheme(changes);
	}

	setTheme = async(theme) => {
		const { setTheme, themePreferences } = this.props;
		const newTheme = { ...themePreferences, ...theme };
		setTheme(newTheme);
		await UserPreferences.setMapAsync(THEME_PREFERENCES_KEY, newTheme);
	};

	renderIcon = () => {
		const { theme } = this.props;
		return <List.Icon name='check' color={themes[theme].tintColor} />;
	}

	renderItem = ({ item }) => {
		const { label, value } = item;
		return (
			<>
				<List.Item
					title={label}
					onPress={() => this.onClick(item)}
					testID={`theme-view-${ value }`}
					right={this.isSelected(item) ? this.renderIcon : null}
				/>
				<List.Separator />
			</>
		);
	}

	render() {
		const { textsize, saving } = this.state;
		const { theme } = this.props;

		return (
			<KeyboardView
				contentContainerStyle={{ ...sharedStyles.container, backgroundColor: themes[theme].backgroundColor }}
				keyboardVerticalOffset={128}
			>
				<StatusBar />
				<ScrollView
					contentContainerStyle={sharedStyles.containerScrollView}
					testID='textsize-view-list'
					{...scrollPersistTaps}
				>
					<View>
						<List.Container>
							<List.Section title='Theme'>
								<List.Separator />
								{
									themeGroup.map(item => this.renderItem({ item }))
								}
							</List.Section>
							<List.Section title='Dark_level'>
								<List.Separator />
								{
									darkGroup.map(item => this.renderItem({ item }))
								}
							</List.Section>
						</List.Container>
					</View>
					<View style={styles.textSizeContainer}>
						<Text style={{ ...styles.itemLabel, color: themes[theme].titleText }}>{I18n.t('Preview')}</Text>
						<View style={styles.preview}>
							<Text style={{ fontSize: textsize, color: themes[theme].auxiliaryText }}>{I18n.t('sample_text')}</Text>
						</View>
						<Text style={{ ...styles.itemLabelSlider, color: themes[theme].titleText }}>{I18n.t('Change_Text_Size')}</Text>
						<View style={styles.sliderContainer}>
							<Image style={styles.sIcon} source={{ uri: 'icon_aa_s' }} />
							<Slider
								style={styles.slider}
								step={4}
								minimumValue={8}
								maximumValue={24}
								onValueChange={(value) => {
									this.setState({ textsize: value });
								}}
								value={textsize}
							/>
							<Image style={styles.mIcon} source={{ uri: 'icon_aa_m' }} />
						</View>
					</View>
					<View>
						<Button
							title={I18n.t('Change_Size')}
							type='primary'
							onPress={this.submit}
							disabled={!this.formIsChanged()}
							testID='textsize-view-button'
							size='w'
							theme={theme}
						/>
					</View>
					<Loading visible={saving} />
				</ScrollView>
			</KeyboardView>
		);
	}
}


const mapStateToProps = state => ({
	userTextSize: state.login.user && state.login.user.textsize
});

const mapDispatchToProps = dispatch => ({
	setUser: params => dispatch(setUserAction(params))
});


export default connect(mapStateToProps, mapDispatchToProps)(withTheme(TextSizeView));

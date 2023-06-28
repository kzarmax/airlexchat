import React from 'react';
import PropTypes from 'prop-types';
import {
	View, Text, Alert
} from 'react-native';
import { connect } from 'react-redux';
import { SafeAreaView } from '../../containers/SafeAreaView';

import RocketChat from '../../lib/rocketchat';
import sharedStyles from '../Styles';
import I18n from '../../i18n';
import Button from '../../containers/Button';
import log from '../../utils/log';
import { logout as logoutAction } from '../../actions/login';
import styles from './styles';
import {withTheme} from "../../theme";
import {themes} from "../../constants/colors";

class DeleteAccount extends React.Component {
	static navigationOptions = {
		title: I18n.t('Delete_Account')
	}

	static propTypes = {
		componentId: PropTypes.string,
		userLanguage: PropTypes.string,
		setUser: PropTypes.func,
		user: PropTypes.object,
		logout: PropTypes.func.isRequired,
		theme: PropTypes.string
	}

	deleteAccount = async() => {
		try {
			await RocketChat.deleteOwnAccount();
		} catch (e) {
			log(e);
			return Alert.alert(I18n.t('Oops'), I18n.t('error-delete-account'));
		}
		this.logout();
	}

	logout = () => {
		const { logout } = this.props;
		logout();
	}

	render() {
		const { theme } = this.props;
		return (
			<View style={{ ...sharedStyles.container, ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='settings-view'>
				<View>
					<Text style={{ ...styles.itemLabel, color: themes[theme].titleText }}>
						{I18n.t('delete_account_text')}
					</Text>
				</View>
				<View>
					<Button
						title={I18n.t('delete_account')}
						type='danger'
						onPress={() => Alert.alert(
							I18n.t('Do_you_really_want_to_delete'),
							null,
							[
								{ text: I18n.t('Yes'), onPress: this.deleteAccount, style: 'destructive' },
								{ text: I18n.t('No'), onPress: () => {}, style: 'cancel' }
							],
							{ cancelable: false }
						)}
						testID='settings-view-button'
						size='w'
						theme={theme}
					/>
				</View>
			</View>
		);
	}
}

const mapStateToProps = state => ({
	user: {
		id: state.login.user && state.login.user.id
	}
});

const mapDispatchToProps = dispatch => ({
	logout: () => dispatch(logoutAction())
});

export default connect(mapStateToProps, mapDispatchToProps)(withTheme(DeleteAccount));

import React from 'react';
import PropTypes from 'prop-types';
import {
	View
} from 'react-native';
import { connect } from 'react-redux';
import { Base64 } from 'js-base64';
import equal from 'deep-equal';
import Button from './Button';
import I18n from '../i18n';

import random from '../utils/random';
import { withTheme } from "../theme";


class OAuthLogin extends React.Component {

	static propTypes = {
		navigation: PropTypes.object,
		server: PropTypes.string,
		services: PropTypes.object,
		isSignup: PropTypes.bool.isRequired,
		theme: PropTypes.string
	}

	shouldComponentUpdate(nextProps) {
		const { server, services } = this.props;
		if (nextProps.server !== server) {
			return true;
		}
		if (!equal(nextProps.services, services)) {
			return true;
		}
		return false;
	}

	onPressApple = () => {
		const { services, server } = this.props;
		const { clientId } = services.apple;
		const endpoint = 'https://appleid.apple.com/auth/authorize';
		const redirect_uri = `${ server }/_oauth/apple?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?response_type=code&response_mode=form_post&client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&scope=${ scope }`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressFacebook = () => {
		const { services, server } = this.props;
		const { clientId } = services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGithub = () => {
		const { services, server } = this.props;
		const { clientId } = services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ encodeURIComponent(params) }`);
	}

	onPressGitlab = () => {
		const { services, server } = this.props;
		const { clientId } = services.gitlab;
		const endpoint = 'https://gitlab.com/oauth/authorize';
		const redirect_uri = `${ server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { services, server } = this.props;
		const { clientId } = services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressLinkedin = () => {
		const { services, server } = this.props;
		const { clientId } = services.linkedin;
		const endpoint = 'https://www.linkedin.com/uas/oauth2/authorization';
		const redirect_uri = `${ server }/_oauth/linkedin?close`;
		const scope = 'r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressMeteor = () => {
		const { services, server } = this.props;
		const { clientId } = services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const { server } = this.props;
		const state = this.getOAuthState();
		const url = `${ server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = (url) => {
		const { navigation } = this.props;
		navigation.navigate('AuthenticationWebView', { url, authType: 'oauth' });
	}


	renderItem = (service) => {
		const { isSignup, theme } = this.props;

		const suf = isSignup ? 'Register' : 'Login';
		let icon = '';
		let onPress = () => {};

		switch (service.name) {
			case 'apple':
				onPress = this.onPressApple;
				icon='apple';
				break;
			case 'facebook':
				onPress = this.onPressFacebook;
				icon='facebook-square';
				break;
			case 'github':
				onPress = this.onPressGithub;
				icon='github-square';
				break;
			case 'gitlab':
				onPress = this.onPressGitlab;
				icon='gitlab';
				break;
			case 'google':
				onPress = this.onPressGoogle;
				icon='google';
				break;
			case 'linkedin':
				onPress = this.onPressLinkedin;
				icon='linkedin-square';
				break;
			case 'meteor-developer':
				onPress = this.onPressMeteor;
				break;
			case 'twitter':
				onPress = this.onPressTwitter;
				icon='twitter';
				break;
			default:
				break;
		}
		return (
			<Button
				key={service.name}
				icon={icon}
				text={I18n.t(`${ suf }_with_${ service.name }`)}
				type={service.name}
				oauth
				size='z'
				onPress={onPress}
				theme={theme}
			/>
		);
	}

	renderServices = () => {
		const { services } = this.props;
		return (
			<View>
				{Object.values(services).map(service => this.renderItem(service))}
			</View>
		);
	}

	render() {
		return (
			this.renderServices()
		);
	}
}

const mapStateToProps = state => ({
	server: state.server.server,
});

export default connect(mapStateToProps, null)(withTheme(OAuthLogin));

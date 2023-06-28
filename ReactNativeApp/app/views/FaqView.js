import React from 'react';
import PropTypes from 'prop-types';
import {
	Linking, View, Text, ScrollView, StyleSheet
} from 'react-native';
import WebView from "react-native-webview";
import { connect } from 'react-redux';
import { RectButton } from 'react-native-gesture-handler';

import { verticalScale } from '../utils/scaling';
import sharedStyles from './Styles';
import I18n from '../i18n';
import { getReadableVersion, isIOS } from '../utils/deviceInfo';
import {withTheme} from "../theme";
import {themes} from "../constants/colors";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'stretch',
	},
	containerScrollView: {
		flex: 1,
		padding: 0,
	},
	item: {
		width: '100%',
		height: 48,
		backgroundColor: '#fff',
		paddingLeft: 20,
		paddingRight: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	text: {
		...sharedStyles.textMedium,
		color: '#0c0d0f',
		fontSize: 18
	},
	itemLabel: {
		fontSize: 18
	},
	headerContainer: {
		alignItems: 'center',
		margin: 20
	},
	webviewContainer: {
		height: isIOS ? verticalScale(1400) : verticalScale(1940),
	},
	bottomContainer: {
		marginTop: 10,
		marginBottom: 10,
		marginLeft: 20,
		marginRight: 20
	}
});

class FaqView extends React.Component {
	static navigationOptions = {
		title: I18n.t('FAQ')
	}

	static propTypes = {
		navigation: PropTypes.object,
		faq: PropTypes.string,
		theme: PropTypes.string
	}

	onPressItem = ({ route }) => {
		const { navigation } = this.props;
		navigation.navigate(route);
	}

	// todo
	renderItem = ({ text, route, testID }) => (
		<RectButton style={styles.item} onPress={() => this.onPressItem({ route })} testID={testID}>
			<Text style={styles.text}>{I18n.t(text)}</Text>
			{/*<DisclosureIndicator />*/}
		</RectButton>
	)

	handleEmail = (event) => {
		if(/mailto/.test(event.url) || /text\/html/.test(event.url)){
			const email = encodeURI('info@airlex.co.jp');
			const subject = encodeURI(I18n.t('Contact_Air_Le_Persona'));
			const description = encodeURI(`
				version: ${ getReadableVersion }
			`);
			Linking.openURL(`mailto:${ email }?subject=${ subject }&body=${ description }`);
		}
	};

	render() {
		const { faq, theme } = this.props;
		let isFit = true;
		if (isIOS) {
			isFit = false;
		}
		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='faq-view'>
				<View style={styles.headerContainer}>
					<Text style={{ ...styles.itemLabel, color: themes[theme].titleText }}>
						{I18n.t('Faq_Text')}
					</Text>
				</View>
				<ScrollView
					contentContainerStyle={styles.containerScrollView}
				>
					<WebView
						style={styles.webviewContainer}
						originWhitelist={['*']}
						source={{ html: faq, baseUrl: '' }}
						scalesPageToFit={isFit}
						viewportContent={'width=device-width, user-scalable=no'}
						javaScriptEnabled={true}
						onNavigationStateChange={event => this.handleEmail(event)}
					/>
				</ScrollView>
			</View>
		);
	}
}


const mapStateToProps = state => ({
	faq: state.settings.Layout_Faq
});

export default connect(mapStateToProps, null)(withTheme(FaqView));

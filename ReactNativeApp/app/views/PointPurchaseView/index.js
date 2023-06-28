import React from 'react';
import PropTypes from 'prop-types';
import { Image, Text, View } from 'react-native';
import { connect } from 'react-redux';

import I18n from '../../i18n';
import styles from './styles';
import Button from '../../containers/Button';
import { withTheme } from '../../theme';
import { GooglePay } from 'react-native-google-pay';
import { ApplePay } from 'react-native-apay';
import {isIOS} from "../../utils/deviceInfo";
import RocketChat from '../../lib/rocketchat';
import { showToast } from '../../utils/info';
import { themes } from '../../constants/colors';
import log from '../../utils/log';

const androidAllowedCardNetworks = ['JCB', 'VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];
const iosAllowedCardNetworks = ['jcb', 'visa', 'mastercard', 'amex', 'privatelabel', 'idcredit', 'discover', 'chinaunionpay', 'interac', 'suica', 'cartebancaires', 'quicpay'];
const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

class PointPurchaseView extends React.Component {
	static navigationOptions = ({ navigation }) => ({
		title: I18n.t('Point_Store')
	})

	static propTypes = {
		baseUrl: PropTypes.string.isRequired,
		stripe: PropTypes.shape({
			enable: PropTypes.boolean,
			publishable_key: PropTypes.string
		}),
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
		const profile = props.route.params.profile;
		this.state = {
			profile: profile
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		return false;
	}

	componentDidUpdate(prevProps) {

	}

	payWithApplePay(){
		const { profile } = this.state;
		const { points, price } = profile;

		const requestData = {
			merchantIdentifier: 'merchant.airlex.chat.dev',
			supportedNetworks: iosAllowedCardNetworks,
			countryCode: 'JP',
			currencyCode: 'JPY',
			paymentSummaryItems: [
				{
					label: I18n.t('Point_Purchase') + ` ${points}pt`,
					amount: price.toString(),
				},
			],
		};

		// Check if ApplePay is available

		if (ApplePay.canMakePayments) {
			ApplePay.requestPayment(requestData)
				.then(async(res) => {
					const paymentData = JSON.parse(res);
					if(paymentData.header.transactionId){
						// Show status to user ApplePay.SUCCESS || ApplePay.FAILURE
						ApplePay.complete(ApplePay.SUCCESS)
							.then(async (paymentData) => {
								console.log('completed', paymentData);
								await this.paySuccess();
								// do something
							});
					}
					ApplePay.complete(ApplePay.FAILURE).then(() => this.payFailed());
				}).catch(e => {
					console.log('error', e);
					ApplePay.complete(ApplePay.FAILURE).then(() => this.payFailed());
			});
		}
	}
	payWithGooglePay() {
		const { profile } = this.state;
		const { stripe } = this.props;
		const { price } = profile;
		const requestData = {
			cardPaymentMethod: {
				tokenizationSpecification: {
					type: 'PAYMENT_GATEWAY',
					gateway: 'stripe',
					gatewayMerchantId: 'BCR2DN6TT6VIPMQI',
					stripe: {
						publishableKey: stripe.publishable_key,
						version: '2018-11-08',
					}
				},
				allowedCardNetworks: androidAllowedCardNetworks,
				allowedCardAuthMethods,
			},
			transaction: {
				totalPrice: price.toString(),
				totalPriceStatus: 'FINAL',
				currencyCode: 'JPY',
			},
			merchantName: 'エアレペルソナ',
		};

		// Set the environment before the payment request
		GooglePay.setEnvironment(GooglePay.ENVIRONMENT_PRODUCTION);

		// Check if Google Pay is available
		GooglePay.isReadyToPay(androidAllowedCardNetworks, allowedCardAuthMethods)
			.then((ready) => {
				if (ready) {
					// Request payment token
					GooglePay.requestPayment(requestData)
						.then(async(res) => {
							// Send a token to your payment gateway
							const tokenData = JSON.parse(res);
							console.log('get token', tokenData);
							if(await RocketChat.createCharge(tokenData.id, price)){
								await this.paySuccess();
							} else {
								this.payFailed();
							}
						})
						.catch(async(error) => {
							console.log(error.code, error.message);
							this.payFailed();
						});
				}
			})
	}

	async paySuccess(){
		const { profile } = this.state;
		try{
			await RocketChat.purchasedPoints( profile.points, profile.price );
		} catch (e) {
			log(e);
		}
		showToast(I18n.t('Points_purchased_successfully', { points: profile.points }));
		this.goToForward();
	}

	payFailed(){
		showToast(I18n.t('Points_purchase_failed'));
	}

	submit(){
		if(isIOS){
			this.payWithApplePay();
		} else {
			this.payWithGooglePay();
		}
	}

	goToForward(){
		const { navigation } = this.props;
		navigation.pop();
	}

	render() {
		const { profile } = this.state;
		const { user, theme } = this.props;
		const { points, price } = profile;
		const stock = user.points;
		return (
			<View style={{ ...styles.container, backgroundColor: themes[theme].backgroundColor }} testID='point-store-container' forceInset={{ bottom: 'never' }}>
				<View style={styles.headerContainer}>
					<Text style={{ ...styles.headerTitle, color: themes[theme].bodyText }}>{I18n.t('Purchase_Content')}</Text>
					<View style={styles.itemContainer}>
						<View style={styles.pointContainer}>
							<Image style={styles.coinIcon} source={{ uri: 'icon_coin' }} />
							<Text style={{ ...styles.headerPoint, color: themes[theme].bodyText }}>{points}pt</Text>
						</View>
						<Text style={{ ...styles.priceLabel, color: themes[theme].bodyText }}>¥{price.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")}</Text>
					</View>
				</View>
				<View style={styles.separator}/>
				<View style={styles.resultContainer}>
					<Text style={{ color: themes[theme].bodyText }}>{I18n.t('Point_Stock_After_Purchase')}</Text>
					<View style={styles.pointContainer}>
						<Image style={styles.coinIcon} source={{ uri: 'icon_coin' }} />
						<Text style={{ ...styles.headerPoint, color: themes[theme].bodyText }}>{points + stock}pt</Text>
					</View>
				</View>
				<View style={{marginHorizontal: 16, marginTop: 16}}>
				<Button
					onPress={() => this.submit()}
					testID='sidebar-toggle-status'
					type='done'
					text={I18n.t('Purchase')}
					size='w'
					theme={theme}
				/>
				<Button
					onPress={() => this.goToForward()}
					testID='sidebar-toggle-status'
					type='grey'
					text={I18n.t('GoTo_Forward_Page')}
					size='w'
					theme={theme}
				/>
				</View>
			</View>
		);
	}
}


const mapStateToProps = state => ({
	stripe: {
		enabled: state.settings.Stripe_Enabled || false,
		publishable_key: state.settings.Stripe_Publishable_key || ''
	},
	user: {
		id: state.login.user && state.login.user.id,
		name: state.login.user && state.login.user.name,
		username: state.login.user && state.login.user.username,
		points: state.login.user && state.login.user.points
	},
	baseUrl: state.settings.Site_Url || state.server ? state.server.server : ''
});

export default connect(mapStateToProps, null)(withTheme(PointPurchaseView));

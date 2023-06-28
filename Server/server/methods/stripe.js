import {Meteor} from "meteor/meteor";
import { settings } from '../../app/settings';
import Stripe from 'stripe';

const stripe = new Stripe(settings.get('Stripe_Secret_key'));

Meteor.methods({
	async createCharge(params) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'createCharge'});
		}
		const charge = await stripe.charges.create(params);
		return charge;
	},
	async createPaymentIntent(params) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'createPaymentIntent'});
		}
		const paymentIntent = await stripe.paymentIntents.create(params);
		return paymentIntent;
	},
	async confirmpaymentIntent(params) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {method: 'confirmpaymentIntent'});
		}

		const { intent_id, payment_data } = params;
		// console.log('params', intent_id, payment_data);
		// const token = new ApplePayPaymentToken(payment_data);
		// console.log('token', token);
		// const decryptedToken = token.decrypt(settings.get('Apple_Pay_cert'), settings.get('Apple_Pay_key'));
		//
		const paymentIntent = await stripe.paymentIntents.confirm(intent_id, payment_data);
		return paymentIntent;
	}
});

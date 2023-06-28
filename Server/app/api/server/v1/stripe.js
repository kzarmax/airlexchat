import { Meteor } from 'meteor/meteor';
import { API } from '../api';

// Strip request payment with token
API.v1.addRoute('createCharge', { authRequired: true }, {
	post() {
		const { amount, token } = this.bodyParams;
		console.log('API.v1.createCharge: ', amount, token);

		try{
			let charge;
			Meteor.runAsUser(this.userId, () => { charge = Meteor.call('createCharge',{
				amount: amount,
				currency: 'jpy',
				description: 'Points purchasing',
				source: token
				});
			});
			console.log('API.v1.createCharge result: ', charge);
			return API.v1.success({});
		} catch(e){
			console.log('Stripe CreateCharge Error', e);
			return API.v1.failure('Stripe Request Failed');
		}
	},
});


// Stripe create payment_intent
API.v1.addRoute('createPaymentIntent', { authRequired: true }, {
	get() {
		const { amount } = this.queryParams;
		console.log('API.v1.createPaymentIntent: ', amount);

		let intent_id = '';
		try{
			let paymentIntent;
			Meteor.runAsUser(this.userId, () => {
				paymentIntent = Meteor.call('createPaymentIntent', {
					amount: amount,
					currency: 'jpy',
					payment_method_types: ['card']
				});
			});

			intent_id = paymentIntent.id;
			console.log('API.v1.createPaymentIntent: ', paymentIntent);
		} catch(e){
			console.log('Stripe CreatePaymentIntent Error', e);
			return API.v1.failure('Stripe Request Failed');
		}

		return API.v1.success({intent_id});
	},
});


// Stripe confirm payment_intent
API.v1.addRoute('confirmPaymentIntent', { authRequired: true }, {
	post() {
		const { intent_id, payment_data } = this.bodyParams;
		console.log('API.v1.confirmPaymentIntent: ', intent_id, payment_data);

		try{
			let paymentIntent;
			Meteor.runAsUser(this.userId, () => {
				paymentIntent = Meteor.call('confirmPaymentIntent', {
					payment_method: 'card',
					...payment_data
				});
			});
			console.log('API.v1.confirmPaymentIntent result: ', paymentIntent);
		} catch(e){
			console.log('Stripe ConfirmPayment Error', e);
			return API.v1.failure('Stripe Request Failed');
		}

		return API.v1.success({});
	},
});

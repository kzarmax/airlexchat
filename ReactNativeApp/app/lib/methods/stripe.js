import log, {LOG_L_LOW} from "../../utils/log";

export async function createCharge( token, amount ){
	try {
		const result = await this.sdk.post('createCharge', { token, amount });
		if(result.success){
			LOG_L_LOW('points Purchased', result);
			return true;
		} else {
			LOG_L_LOW('err_purchased_points', result);
		}
	} catch (e) {
		log(e, 'Stripe Create Charge');
	}
	return false;
}

export async function createPaymentIntent( amount ){
	try {
		const result = await this.sdk.get('createPaymentIntent', { amount });
		if(result.success){
			LOG_L_LOW('points Purchased', result);
			return result.intent_id;
		} else {
			LOG_L_LOW('err_purchased_points', result);
		}
	} catch (e) {
		log(e, 'Stripe Create Payment Intent');
	}
	return null;
}

export async function confirmPaymentIntent( intent_id, paymentData ){
	try {
		const result = await this.sdk.post('confirmPaymentIntent', { intent_id, payment_data: paymentData });
		if(result.success){
			LOG_L_LOW('points Purchased', result);
			return true;
		} else {
			LOG_L_LOW('err_purchased_points', result);
		}
	} catch (e) {
		log(e);
	}
	return false;
}


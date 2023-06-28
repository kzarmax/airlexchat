import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { PointPurchaseHistory } from '../../../models';

Meteor.methods({
	removeAllPurchaseHistory() {
		if (!hasPermission(this.userId, 'manage-point-profile')) {
			throw new Meteor.Error('not_authorized');
		}
		PointPurchaseHistory.remove({});
		return true;
	}
});

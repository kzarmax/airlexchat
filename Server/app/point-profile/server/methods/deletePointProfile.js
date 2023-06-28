import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { PointProfile } from '../../../models';
import { Notifications } from '../../../notifications';

Meteor.methods({
	deletePointProfile(id) {
		let pointProfile = null;

		if (hasPermission(this.userId, 'manage-point-profile')) {
			pointProfile = PointProfile.findOneById(id);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		PointProfile.removeById(id);
		Notifications.notifyLogged('deletePointProfile', { pointProfileData: pointProfile });

		return true;
	},
});

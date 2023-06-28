import { Meteor } from 'meteor/meteor';

import { PointProfile } from '../../../models';

Meteor.methods({
	listPointProfile(options = {}) {
		return PointProfile.find(options).fetch();
	},
});

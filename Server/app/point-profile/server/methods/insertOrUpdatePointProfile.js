import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';

import { hasPermission } from '../../../authorization';
import { Notifications } from '../../../notifications';
import { PointProfile } from '../../../models';

Meteor.methods({
	insertOrUpdatePointProfile(pointProfileData) {
		if (!hasPermission(this.userId, 'manage-point-profile')) {
			throw new Meteor.Error('not_authorized');
		}

		if (!s.trim(pointProfileData.points)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Points is required', { method: 'insertOrUpdatePointProfile', field: 'Points' });
		}

		if (!s.trim(pointProfileData.price)) {
			throw new Meteor.Error('error-the-field-is-required', 'The field Price is required', { method: 'insertOrUpdatePointProfile', field: 'Price' });
		}

		pointProfileData.points = Number(pointProfileData.points);
		pointProfileData.price = Number(pointProfileData.price);

		if (isNaN(pointProfileData.points)) {
			throw new Meteor.Error('error-input-is-not-a-valid-field', `${ pointProfileData.points } is not a valid points`, { method: 'insertOrUpdatePointProfile', input: pointProfileData.points, field: 'Points' });
		}

		if (isNaN(pointProfileData.price)) {
			pointProfileData.price = 0;
		}

		let matchingResults = [];

		if (pointProfileData._id) {
			matchingResults = PointProfile.findByPointsExceptID(pointProfileData.points, pointProfileData._id).fetch();
		} else {
			matchingResults = PointProfile.findByPoints(pointProfileData.points).fetch();
		}

		if (matchingResults.length > 0) {
			throw new Meteor.Error('PointProfile_Error_Points_Already_Defined', 'The point profile is already defined', { method: 'insertOrUpdatePointProfile' });
		}

		if (!pointProfileData._id) {
			// insert pointProfile
			const createPointProfile = {
				points: pointProfileData.points,
				price: pointProfileData.price,
			};

			const _id = PointProfile.create(createPointProfile);

			Notifications.notifyLogged('updatePointProfile', { _id, ...createPointProfile });

			return _id;
		}

		// update Profile
		if (pointProfileData.points !== pointProfileData.previousPoints) {
			PointProfile.setPoints(pointProfileData._id, pointProfileData.points);
		}

		if (pointProfileData.price !== pointProfileData.previousPrice) {
			PointProfile.setPrice(pointProfileData._id, pointProfileData.price);
		}

		Notifications.notifyLogged('updatePointProfile', { ...pointProfileData });

		return true;
	},
});

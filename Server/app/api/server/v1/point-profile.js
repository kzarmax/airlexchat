import { Meteor } from 'meteor/meteor';
import Busboy from 'busboy';
import { PointProfile, PointPurchaseHistory, Users} from '../../../models';
import { API } from '../api';
import {findPoinProfile, findPoinPurchaseHistory} from "/app/api/server/lib/point-profile";

API.v1.addRoute('point-profile.list', { authRequired: true }, {
	get() {
		const { query } = this.parseJsonQuery();
		const { updatedSince } = this.queryParams;

		let updatedSinceDate;
		if (updatedSince) {
			if (isNaN(Date.parse(updatedSince))) {
				throw new Meteor.Error('error-roomId-param-invalid', 'The "updatedSince" query parameter must be a valid date.');
			} else {
				updatedSinceDate = new Date(updatedSince);
			}
			return API.v1.success({
				profiles: {
					update: PointProfile.find({ ...query, _updatedAt: { $gt: updatedSinceDate } }).fetch(),
					remove: PointProfile.trashFindDeletedAfter(updatedSinceDate).fetch(),
				},
			});
		}

		console.log(query);

		return API.v1.success({
			profiles: {
				update: PointProfile.find(query).fetch(),
				remove: [],
			},
		});
	},
});

API.v1.addRoute('point-profile.all', { authRequired: true }, {
	get() {
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPoinProfile({
			query,
			pagination: {
				sort,
			},
		})));
	},
});

API.v1.addRoute('point-profile.create', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => {
			const fields = {};
			const busboy = new Busboy({ headers: this.request.headers });

			Meteor.wrapAsync((callback) => {
				busboy.on('field', (fieldname, val) => {
					fields[fieldname] = val;
				});
				busboy.on('finish', Meteor.bindEnvironment(() => {
					try {
						Meteor.call('insertOrUpdatePointProfile', fields);
						callback();
					} catch (error) {
						return callback(error);
					}
				}));
				this.request.pipe(busboy);
			})();
		});
	},
});

API.v1.addRoute('point-profile.update', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => {
			const fields = {};
			const busboy = new Busboy({ headers: this.request.headers });

			Meteor.wrapAsync((callback) => {
				busboy.on('field', (fieldname, val) => {
					fields[fieldname] = val;
				});
				busboy.on('finish', Meteor.bindEnvironment(() => {
					try {
						if (!fields._id) {
							return callback(new Meteor.Error('The required "_id" query param is missing.'));
						}
						const pointProfileToUpdate = PointProfile.findOneById(fields._id);
						if (!pointProfileToUpdate) {
							return callback(new Meteor.Error('Emoji not found.'));
						}
						fields._id = pointProfileToUpdate._id;
						fields.previousPoints = pointProfileToUpdate.points;
						fields.previousPrice = pointProfileToUpdate.price;
						Meteor.call('insertOrUpdatePointProfile', fields);
						callback();
					} catch (error) {
						return callback(error);
					}
				}));
				this.request.pipe(busboy);
			})();
		});
	},
});

API.v1.addRoute('point-profile.delete', { authRequired: true }, {
	post() {
		const { pointProfileId } = this.bodyParams;
		if (!pointProfileId) {
			return API.v1.failure('The "pointProfileId" params is required!');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('deletePointProfile', pointProfileId));

		return API.v1.success();
	},
});

API.v1.addRoute('point-purchased', { authRequired: true }, {
	post() {
		try{
			const { points, price } = this.bodyParams;

			const user = Meteor.user();

			const user_points = points + (!user.points?0:user.points);
			Users.update({ _id: user._id }, {
				$set: {
					points: user_points,
				},
			});

			const history = {
				user_id: user._id,
				username: user.username,
				name: user.name,
				email: user.emails[0].address,
				points,
				user_points,
				price,
				purchased_at: new Date()
			};
			PointPurchaseHistory.create(history);
			return API.v1.success(true);
		}catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('point-purchase-history.all', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, query } = this.parseJsonQuery();

		return API.v1.success(Promise.await(findPoinPurchaseHistory({
			query,
			pagination: {
				offset,
				count,
				sort,
			},
		})));
	},
});

API.v1.addRoute('point-purchase-history.remove-all', { authRequired: true }, {
	post() {
		Meteor.runAsUser(this.userId, () => Meteor.call('removeAllPurchaseHistory'));

		return API.v1.success();
	},
});

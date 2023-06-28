import { Base } from './_Base';

class PointPurchaseHistory extends Base {
	constructor() {
		super('point_purchase_history');

		this.tryEnsureIndex({ user_id: 1 });
		this.tryEnsureIndex({ points: 1 });
	}

	// find one
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// find
	findByPoints(points, options) {

		const query = {
			points,
		};

		return this.find(query, options);
	}

	findByUserId(user_id, options) {
		const query = {
			user_id,
		};

		return this.find(query, options);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new PointPurchaseHistory();

import { Base } from './_Base';

class PointProfile extends Base {
	constructor() {
		super('point_profile');

		this.tryEnsureIndex({ points: 1 });
		this.tryEnsureIndex({ price: 1 });
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

	findByPointsExceptID(points, except, options) {
		const query = {
			_id: { $nin: [except] },
			points
		};

		return this.find(query, options);
	}


	// update
	setPoints(_id, points) {
		const update = {
			$set: {
				points,
			},
		};

		return this.update({ _id }, update);
	}

	setPrice(_id, price) {
		const update = {
			$set: {
				price,
			},
		};

		return this.update({ _id }, update);
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

export default new PointProfile();

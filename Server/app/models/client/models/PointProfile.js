import { Base } from './_Base';

export class PointProfile extends Base {
	constructor() {
		super();
		this._initModel('point_profile');
	}

	// find
	findByPoints(points, options) {
		const query = {
			points
		};

		return this.find(query, options);
	}
}

export default new PointProfile();

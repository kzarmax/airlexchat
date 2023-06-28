import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class PointProfile extends Model {
	static table = 'point_profiles';

	@field('points') points;

	@field('price') price;

	@date('_updated_at') _updatedAt;
}

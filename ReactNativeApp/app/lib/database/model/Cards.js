import { Model } from '@nozbe/watermelondb';
import { field, json, date } from '@nozbe/watermelondb/decorators';
import { sanitizer } from '../utils';

export default class Cards extends Model {
	static table = 'cards';

	@field('_id') _id;

	@field('cId') cId;

	@date('_updatedAt') _updatedAt;

	@field('active') active;

	@field('avatarOrigin') avatarOrigin;

	@json('blocks', sanitizer) blocks;

	@date('CreatedAt') CreatedAt;

	@field('imageOrigin') imageOrigin;

	@field('name') name;

	@field('order') order;

	@json('scene', sanitizer) scene;

	@field('userId') userId;

	@field('username') username;

	@field('isSecret') isSecret;

	@field('back_color') back_color;

	@field('text_color') text_color;

	@field('avatar_etag') avatarETag;

	@json('disabled_option', sanitizer) disabledOption;
}

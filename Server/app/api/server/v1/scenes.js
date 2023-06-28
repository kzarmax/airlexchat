import { Scenes, ProfileTypes } from '../../../models';
import { API } from '../api';

/**
 * シーン情報を取得する
 *
 * @param  String sceneId シーンID
 * @return scene シーン情報
 */
API.v1.addRoute('scenes.info', { authRequired: true }, {
	get() {
		const params = this.requestParams();

		return API.v1.success({ scene: Scenes.findOneById(params.sceneId) });
	},
});

/**
 * シーン情報の一覧を取得する
 * @return {
 *     scenes シーン情報一覧
 *     profileTypes プロフィールタイプ一覧
 * }
 */
API.v1.addRoute('scenes.list', { authRequired: true }, {
	get() {
		let _scenes = Scenes.findByPublicItem().fetch();

		if (!Array.isArray(_scenes)) {
			_scenes = [];
		}

		let _profiles = ProfileTypes.findByPublicItem().fetch();

		if (!Array.isArray(_profiles)) {
			_profiles = [];
		}

		return API.v1.success({ scenes: _scenes, profileTypes: _profiles });
	},
});

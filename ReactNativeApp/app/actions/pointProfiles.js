import * as types from './actionsTypes';

export function setPointProfiles(profiles) {
	return {
		type: types.SET_POINT_PROFILES,
		profiles
	};
}

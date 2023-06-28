import { SET_POINT_PROFILES } from '../actions/actionsTypes';

const initialState = [];

export default function pointProfiles(state = initialState, action) {
	switch (action.type) {
		case SET_POINT_PROFILES:
			return action.profiles;
		default:
			return state;
	}
}

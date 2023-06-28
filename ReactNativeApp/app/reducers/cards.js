import * as types from '../actions/actionsTypes';

const initialState = {
	isFetching: false,
	failure: false,
	errorMessage: {},
	cards: [],
	selected: null,
	selectAll: false
};

export default function cards(state = initialState, action) {
	switch (action.type) {
		case types.CARDS.REQUEST:
			return {
				...state,
				isFetching: true,
				failure: false,
				errorMessage: {}
			};
		case types.CARDS.SUCCESS:
			return {
				...state,
				isFetching: false,
				failure: false
			};
		case types.CARDS.FAILURE:
			return {
				...state,
				isFetching: false,
				failure: true,
				errorMessage: action.err
			};
		case types.CARDS.SET:
			return {
				...state,
				cards: action.cards
			};
		case types.CARDS.SELECTED:
			return {
				...state,
				selected: action.card,
				selectAll: false
			};
		case types.CARDS.SELECT_ALL:
			return {
				...state,
				selectAll: action.selectAll
			};
		default:
			return state;
	}
}

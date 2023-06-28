import * as types from './actionsTypes';


export function cardsRequest(data) {
	return {
		type: types.CARDS.REQUEST,
		data
	};
}

export function cardsSuccess() {
	return {
		type: types.CARDS.SUCCESS
	};
}

export function cardsFailure(err) {
	return {
		type: types.CARDS.FAILURE,
		err
	};
}

export function setCards(cards) {
	return {
		type: types.CARDS.SET,
		cards
	};
}

export function selectOne(params) {
	return {
		type: types.CARDS.SELECT,
		params
	};
}

export function selected(card) {
	return {
		type: types.CARDS.SELECTED,
		card
	};
}

export function selectAllCard(selectAll) {
	return {
		type: types.CARDS.SELECT_ALL_REQUEST,
		selectAll
	};
}

export function setAllCard(selectAll) {
	return {
		type: types.CARDS.SELECT_ALL,
		selectAll
	};
}

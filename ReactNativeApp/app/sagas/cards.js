import {
	put, takeLatest, select
} from 'redux-saga/effects';

import { CARDS } from '../actions/actionsTypes';
import {
	cardsSuccess,
	cardsFailure,
	setCards,
	selected,
	selectAllCard, setAllCard, selectOne
} from '../actions/cards';
import log from '../utils/log';
import RocketChat from '../lib/rocketchat';
import { CARD_SELECT_ALL } from '../constants/storage';
import UserPreferences from '../lib/userPreferences';

const handleCardsRequest = function* handleCardsRequest({ data }) {
	try {
		const { selectAll, cards } = data;

		const selected = cards.filter(card => card.active);

		// todo : when loading with secret card, change to a normal card.
		if(!selectAll && selected.length && selected[0].isSecret){
			const noSecretCard = cards.find(card => !card.isSecret);
			if(noSecretCard){
				yield put(selectOne({ id: noSecretCard._id}));
			}
			else{
				yield put(setCards(cards));
				yield put(selectAllCard(true));
			}
		} else {
			yield put(setCards(cards));
			yield put(setAllCard(selectAll));
		}

		yield put(cardsSuccess());
	} catch (e) {
		yield put(cardsFailure(e));
		log(e, 'handleCardsRequest Error: ');
	}
};

const handleSetCards = function* handleSetCards({ cards }) {
	try {
		if (cards) {
			const _selected = cards.filter(card => card.active);
			if (_selected.length === 1) {
				yield put(selected(_selected[0]));
			}
			const userId = select(state => state.login.user.id);
			yield RocketChat.fetchCards(cards, userId);
		}
	} catch (e) {
		log(e, 'handleSetCards Error: ');
	}
};

const handleSelectOneCard = function* handleSelectOneCard({ params }) {
	try {
		const { id, callback } = params;
		const { cards } = yield RocketChat.selectOneCard(id);
		yield put(setCards(cards));
		yield put(setAllCard(false));
		if(callback){
			callback();
		}
	} catch (e) {
		log(e, 'handleSelectOneCard Error: ');
	}
};

const handleSelectAllCard = function* handleSelectAllCard(params) {
	try {
		yield RocketChat.selectAllCard(params.selectAll);
		yield put(setAllCard(params.selectAll));
		// Move to Normal Card from Secret Card
		const selectedCard = yield select(state => state.cards.selected);
		if(!selectedCard || selectedCard.isSecret)
		{
			const cards = yield select(state=>state.cards.cards);
			const noSecretCards = cards.find(card=>!card.isSecret);
			if(noSecretCards) {
				yield put(selected(noSecretCards));
			}
		}
	} catch (e) {
		log(e, 'handleSelectAllCard Error: ');
	}
};

const handleSelectAll = function * handleSelectAll({selectAll}){
	try {
		yield UserPreferences.setBoolAsync(CARD_SELECT_ALL, selectAll);
	} catch (e) {
		log(e);
	}
}

const root = function* root() {
	yield takeLatest(CARDS.REQUEST, handleCardsRequest);
	yield takeLatest(CARDS.SET, handleSetCards);
	yield takeLatest(CARDS.SELECT, handleSelectOneCard);
	yield takeLatest(CARDS.SELECT_ALL, handleSelectAll);
	yield takeLatest(CARDS.SELECT_ALL_REQUEST, handleSelectAllCard);
};
export default root;

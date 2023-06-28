import { select, takeLatest, put } from 'redux-saga/effects';
import { APP_STATE } from '../actions/actionsTypes';
import { selectAllCard, selectOne } from '../actions/cards';
import reduxStore from '../lib/createStore';

let backGroundResetCardTimer = null;

const appHasComeBackToForeground = function* appHasComeBackToForeground() {
	if(backGroundResetCardTimer){
		setTimeout(() => {
			clearTimeout(backGroundResetCardTimer);
		}, 100);
	}
};

const appHasComeBackToBackground = function* appHasComeBackToBackground() {
	const selected = yield select(state => state.cards.selected);
	const selectAll = yield select(state => state.cards.selectAll);
	if(!selectAll && selected && selected.isSecret)
	{
		const cards = yield select(state=> state.cards.cards);
		backGroundResetCardTimer = setTimeout(async () => {
			const noSecretCard = cards.find(card => !card.isSecret);
			if(noSecretCard){
				reduxStore.dispatch(selectOne({ id: noSecretCard._id, callback: () => {} }));
			}
			else{
				reduxStore.dispatch(selectAllCard(true));
			}
		}, 5 * 60000);
	}
};

const root = function* root() {
	yield takeLatest(
		APP_STATE.FOREGROUND,
		appHasComeBackToForeground
	);
	yield takeLatest(
		APP_STATE.BACKGROUND,
		appHasComeBackToBackground
	);
};
export default root;

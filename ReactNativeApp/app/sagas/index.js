import { all } from 'redux-saga/effects';
import login from './login';
import rooms from './rooms';
import room from './room';
import messages from './messages';
import selectServer from './selectServer';
import createChannel from './createChannel';
import init from './init';
import state from './state';
import deepLinking from './deepLinking';
import inviteLinks from './inviteLinks';
import createDiscussion from './createDiscussion';

import encryption from './encryption';
import cards from './cards';
import forceUpdate from './forceUpdate';
import resetCard from './resetCard';

import inquiry from '../ee/omnichannel/sagas/inquiry';

const root = function* root() {
	yield all([
		init(),
		createChannel(),
		cards(),
		rooms(),
		room(),
		login(),
		messages(),
		selectServer(),
		state(),
		deepLinking(),
		inviteLinks(),
		createDiscussion(),
		inquiry(),
		encryption(),
		forceUpdate(),
		resetCard()
	]);
};

export default root;

import Navigation from '../lib/Navigation';
import RocketChat from '../lib/rocketchat';
import reduxStore from '../lib/createStore';
import {setRoom} from "../actions/room";
import { selectOne } from '../actions/cards';

const navigate = ({ item, isMasterDetail, searchMessage, searchText, ...props }) => {
	let navigationMethod = Navigation.navigate;

	if (isMasterDetail) {
		navigationMethod = Navigation.replace;
	}

	if(Navigation.getCurrentRoute() === 'RoomView'){
		Navigation.back();
	}

	const { cards } = reduxStore.getState();
	if(cards.selected._id !== item.cardId){
		reduxStore.dispatch(selectOne({ id: item.cardId }));
	}

	reduxStore.dispatch(setRoom({
		rid: item.rid,
		cardId: item.cardId,
		c: item.c,
		u: item.u,
		searchedMessage: searchMessage??null,
		searchText: searchText??null
	}));

	navigationMethod('RoomView', {
		rid: item.rid,
		name: item.name,
		fname: item.fname,
		cardId: item.cardId,
		t: item.t,
		f: item.f,
		prid: item.prid,
		room: { rid: item.rid, cardId: item.cardId, c: item.c, u: item.u, t: item.t, f: item.f, prid: item.prid },
		searchedMessage: item.searchedMessage??null,
		searchText: searchText??null,
		visitor: item.visitor,
		roomUserId: RocketChat.getUidDirectMessage(item),
		...props
	});
};

export const goRoom = async({ item = {}, isMasterDetail = false, ...props }) => {
	return navigate({ item, isMasterDetail, ...props });
};

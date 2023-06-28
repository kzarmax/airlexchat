import { ROOM } from '../actions/actionsTypes';

const initialState = {
	rid: null,
	isDeleting: false,
	rooms: [],
	isShowingAddEmoji: false,
	isShowingEmojiKeyboard: false,
	currentCustomEmoji: null
};

export default function(state = initialState, action) {
	switch (action.type) {
		case ROOM.SUBSCRIBE:
			return {
				...state,
				rooms: [action.rid, ...state.rooms]
			};
		case ROOM.UNSUBSCRIBE:
			return {
				...state,
				rooms: state.rooms
					.filter(rid => rid !== action.rid)
			};
		case ROOM.SET:
			return {
				...initialState,
				...action.room
			};
		case ROOM.SHOW:
			return {
				...initialState,
				...action.room
			};
		case ROOM.LEAVE:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.DELETE:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.CLOSE:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.FORWARD:
			return {
				...state,
				rid: action.rid,
				isDeleting: true
			};
		case ROOM.REMOVED:
			return {
				...state,
				isDeleting: false
			};
		case ROOM.SHOW_ADD_EMOJI_MODAL:
			return {
				...state,
				isShowingAddEmoji: action.isShowingAddEmoji,
			};
		case ROOM.SHOW_EMOJI_KEYBORD:
			return {
				...state,
				isShowingEmojiKeyboard: action.isShowingEmojiKeyboard,
			};
		case ROOM.CURRENT_CUSTOM_EMOJI:
			return {
				...state,
				currentCustomEmoji: action.currentCustomEmoji,
			};
		default:
			return state;
	}
}

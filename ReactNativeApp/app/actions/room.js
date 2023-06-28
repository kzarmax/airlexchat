import * as types from './actionsTypes';

export function subscribeRoom(rid) {
	return {
		type: types.ROOM.SUBSCRIBE,
		rid
	};
}

export function unsubscribeRoom(rid) {
	return {
		type: types.ROOM.UNSUBSCRIBE,
		rid
	};
}

export function leaveRoom(rid, t, cardId) {
	return {
		type: types.ROOM.LEAVE,
		rid,
		t,
		cardId
	};
}

export function setRoom(room) {
	return {
		type: types.ROOM.SET,
		room
	};
}

export function deleteRoom(rid, t, cardId) {
	return {
		type: types.ROOM.DELETE,
		rid,
		t,
		cardId
	};
}

export function closeRoom(rid) {
	return {
		type: types.ROOM.CLOSE,
		rid
	};
}

export function forwardRoom(rid, transferData) {
	return {
		type: types.ROOM.FORWARD,
		transferData,
		rid
	};
}

export function removedRoom() {
	return {
		type: types.ROOM.REMOVED
	};
}

export function userTyping(rid, username, status = true) {
	return {
		type: types.ROOM.USER_TYPING,
		rid,
		username,
		status
	};
}

export function setLastOpen(date = new Date()) {
	return {
		type: types.ROOM.SET_LAST_OPEN,
		date
	};
}

export function setShowingAddEmojiModal(isShowingAddEmoji){
	return {
		type: types.ROOM.SHOW_ADD_EMOJI_MODAL,
		isShowingAddEmoji
	}
}

export function setShowingEmojiKeyboard(isShowingEmojiKeyboard){
	return {
		type: types.ROOM.SHOW_EMOJI_KEYBORD,
		isShowingEmojiKeyboard
	}
}

export function setCurrentCustomEmoji(currentCustomEmoji){
	return {
		type: types.ROOM.CURRENT_CUSTOM_EMOJI,
		currentCustomEmoji
	}
}


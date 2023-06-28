export default {
	SENT: 0,
	TEMP: 1,
	ERROR: 2
};

export const SERVER_ID = 'airlex.chat'

export const OPTION_CHAT = 'chat';
export const OPTION_PHONE = 'phone';
export const OPTION_VIDEO = 'video';

export const DISABLED_OPTIONS = [
	OPTION_CHAT,
	OPTION_PHONE,
	OPTION_VIDEO
]

export const DISABLED_OPTION_MESSAGES = [
	'room_is_limited_for_chatting',
	'room_is_limited_for_call',
	'room_is_limited_for_video_call'
]
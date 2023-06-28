// import { Meteor } from 'meteor/meteor';
import s from 'underscore.string';
import { settings } from '../../../settings';

let usernameBlackList = [];

const toRegExp = (username) => new RegExp(`^${ s.escapeRegExp(username).trim() }$`, 'i');

settings.get('Accounts_BlockedUsernameList', (key, value) => {
	usernameBlackList = value.split(',').map(toRegExp);
});

const usernameIsBlocked = (username, usernameBlackList) => usernameBlackList.length
	&& usernameBlackList.some((restrictedUsername) => restrictedUsername.test(s.trim(s.escapeRegExp(username))));

export const checkUsernameBlocked = function(username) {

	return usernameIsBlocked(username, usernameBlackList);
};

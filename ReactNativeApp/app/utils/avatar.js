import semver from 'semver';

const formatUrl = (url, size, query) => `${ url }?format=png&size=${ size }${ query }`;

export const avatarURL = ({
	type, text, size, user = {}, avatar, server, avatarETag, rid, blockUnauthenticatedAccess
}) => {

	const uriSize = size > 100 ? size : 100;

	const { id, token } = user;
	let query = '';
	if (id && token && blockUnauthenticatedAccess) {
		query += `&rc_token=${ token }&rc_uid=${ id }`;
	}
	if (avatarETag) {
		query += `&etag=${ avatarETag }`;
	}

	if (avatar) {
		if (avatar.startsWith('http')) {
			return avatar;
		}

		return formatUrl(`${ server }${ avatar }`, uriSize, query);
	}

	let room;
	if (type === 'ca') {
		room = `avatar/${text}`;
	} else if (type === 'ci') {
		room = `card/${text}`;
	} else if (type === 'd') {
		room = `avatar/${text}`;
	} else if (rid) {
		room = `avatar/room/${ rid }`;
	} else {
		room = `avatar/@${ text }`;
	}
	return formatUrl(`${ server }/${ room }`, uriSize, query);
};

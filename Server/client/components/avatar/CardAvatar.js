import React, { memo } from 'react';

import BaseAvatar from './BaseAvatar';

function CardAvatar({ id, title, type='ca', etag, ...rest }) {
	let url;
	if(type === 'ca'){
		url = `/avatar/${id}`;
	} else {
		url = `/card/${id}`;
	}
	if(etag){
		url += `?etag=${etag}`;
	}
	const { ...props } = rest;

	return <BaseAvatar url={url} title={title} {...props}/>;
}

export default memo(CardAvatar);

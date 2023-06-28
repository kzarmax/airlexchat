
const fetchCustomEmoji = (emoji, customEmojis) => {
	console.log('custom emoji', emoji, customEmojis);
	for(let pEmoji of customEmojis){
		if(pEmoji.name === emoji)
			return pEmoji;
		const childEmojis = Object.keys(pEmoji.children).map(key => pEmoji.children[key]);
		for(let childEmoji of childEmojis){
			if(childEmoji.name === emoji)
				return childEmoji;
		}
	}
	return null;
}

export default fetchCustomEmoji;

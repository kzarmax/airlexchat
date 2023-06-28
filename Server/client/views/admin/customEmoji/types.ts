export type EmojiDescriptor = {
	_id: string;
	name: string;
	parent: string;
	aliases: string;
	points: number;
	extension: string;
};

export type EmojiParentDescriptor = {
	_id: string;
	name: string;
};

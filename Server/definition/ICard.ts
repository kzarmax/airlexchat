import { IRocketChatRecord } from './IRocketChatRecord';

export interface ICard extends IRocketChatRecord {
	_id: string;
	userId: string;
	cId: string;
	name: string;
	isSecret: boolean;
	avatarETag: string;
}

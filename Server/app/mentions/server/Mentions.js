/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import { MentionsParser } from '../lib/MentionsParser';
import XRegExp from "xregexp";

export default class MentionsServer extends MentionsParser {
	constructor(args) {
		super(args);
		this.messageMaxAll = args.messageMaxAll;
		this.getChannel = args.getChannel;
		this.getChannels = args.getChannels;
		this.getUsers = args.getUsers;
		this.getUser = args.getUser;
		this.getChannelMembers = args.getChannelMembers;
		this.getTotalChannelMembers = args.getTotalChannelMembers;
		this.onMaxRoomMembersExceeded = args.onMaxRoomMembersExceeded || (() => {});
	}

	set getUsers(m) {
		this._getUsers = m;
	}

	get getUsers() {
		return typeof this._getUsers === 'function' ? this._getUsers : () => this._getUsers;
	}

	set getChannels(m) {
		this._getChannels = m;
	}

	get getChannels() {
		return typeof this._getChannels === 'function' ? this._getChannels : () => this._getChannels;
	}

	set getChannel(m) {
		this._getChannel = m;
	}

	get getChannel() {
		return typeof this._getChannel === 'function' ? this._getChannel : () => this._getChannel;
	}

	set messageMaxAll(m) {
		this._messageMaxAll = m;
	}

	get messageMaxAll() {
		return typeof this._messageMaxAll === 'function' ? this._messageMaxAll() : this._messageMaxAll;
	}

	getUsersByMentions({ msg, rid, c: sender }) {
		let mentions = this.getUserMentions(msg);
		const mentionsAll = [];
		const userMentions = [];

		mentions.forEach((m) => {
			const mention = m.trim().substr(1);
			if (mention !== 'all' && mention !== 'here') {
				return userMentions.push(mention);
			}
			if (this.messageMaxAll > 0 && this.getTotalChannelMembers(rid) > this.messageMaxAll) {
				return this.onMaxRoomMembersExceeded({ sender, rid });
			}
			mentionsAll.push({
				_id: mention,
				username: mention,
			});
		});

		if(userMentions.length){
			const members = this.getChannelMembers(rid);
			const mentionMembers = members.map(member => ({ ...member, parseName: member.username.replace(new XRegExp('[^0-9a-zA-Z\\p{Hiragana}\\p{Katakana}\\p{Han}-_.]', 'g'), '')}))
			mentions = mentionMembers.filter(member => userMentions.includes(member.parseName));
		} else {
			mentions = [];
		}
		return [...mentionsAll, ...mentions];
	}

	getChannelbyMentions({ msg }) {
		const channels = this.getChannelMentions(msg);
		return this.getChannels(channels.map((c) => c.trim().substr(1)));
	}

	execute(message) {
		const mentionsAll = this.getUsersByMentions(message);
		const channels = [];
		// disable channel mention
		//const channels = this.getChannelbyMentions(message);

		message.mentions = mentionsAll;
		message.channels = channels;

		return message;
	}
}

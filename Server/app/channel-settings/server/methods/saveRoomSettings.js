import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { setRoomAvatar } from '../../../lib/server/functions/setRoomAvatar';
import { hasPermission } from '../../../authorization';
import { Rooms, Cards } from '../../../models';
import { callbacks } from '../../../callbacks';
import { saveRoomName } from '../functions/saveRoomName';
import { saveRoomTopic } from '../functions/saveRoomTopic';
import { saveRoomAnnouncement } from '../functions/saveRoomAnnouncement';
import { saveRoomCustomFields } from '../functions/saveRoomCustomFields';
import { saveRoomDescription } from '../functions/saveRoomDescription';
import { saveRoomType } from '../functions/saveRoomType';
import { saveRoomReadOnly } from '../functions/saveRoomReadOnly';
import { saveReactWhenReadOnly } from '../functions/saveReactWhenReadOnly';
import { saveRoomSystemMessages } from '../functions/saveRoomSystemMessages';
import { saveRoomTokenpass } from '../functions/saveRoomTokens';
import { saveStreamingOptions } from '../functions/saveStreamingOptions';
import { RoomSettingsEnum, roomTypes } from '../../../utils';

const fields = ['roomAvatar', 'featured', 'roomName', 'roomTopic', 'roomAnnouncement', 'roomCustomFields', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions', 'retentionEnabled', 'retentionMaxAge', 'retentionExcludePinned', 'retentionFilesOnly', 'retentionIgnoreThreads', 'retentionOverrideGlobal', 'encrypted', 'favorite'];

const validators = {
	default({ userId }) {
		if (!hasPermission(userId, 'view-room-administration')) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	featured({ userId }) {
		if (!hasPermission(userId, 'view-room-administration')) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	roomType({ userId, room, value }) {
		if (value === room.t) {
			return;
		}

		if (value === 'c' && !hasPermission(userId, 'create-c')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}

		if (value === 'p' && !hasPermission(userId, 'create-p')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}
	},
	encrypted({ value, room }) {
		if (value !== room.encrypted && !roomTypes.getConfig(room.t).allowRoomSettingChange(room, RoomSettingsEnum.E2E)) {
			throw new Meteor.Error('error-action-not-allowed', 'Only groups or direct channels can enable encryption', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Encrypted',
			});
		}
	},
	retentionEnabled({ userId, value, room, rid }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.enabled) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionMaxAge({ userId, value, room, rid }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.maxAge) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionExcludePinned({ userId, value, room, rid }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.excludePinned) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionFilesOnly({ userId, value, room, rid }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.filesOnly) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionIgnoreThreads({ userId, value, room, rid }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.ignoreThreads) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	roomAvatar({ userId, rid }) {
		if (!hasPermission(userId, 'edit-room-avatar', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing a room avatar is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
};

const settingSavers = {
	roomName({ value, rid, card }) {
		saveRoomName(rid, value, card);
	},
	roomTopic({ value, room, rid, card }) {
		if (value !== room.topic) {
			saveRoomTopic(rid, value, card);
		}
	},
	roomAnnouncement({ value, room, rid, card }) {
		if (value !== room.announcement) {
			saveRoomAnnouncement(rid, value, card);
		}
	},
	roomCustomFields({ value, room, rid }) {
		if (value !== room.customFields) {
			saveRoomCustomFields(rid, value);
		}
	},
	roomDescription({ value, room, rid, card }) {
		if (value !== room.description) {
			saveRoomDescription(rid, value, card);
		}
	},
	roomType({ value, room, rid, user, card }) {
		if (value !== room.t) {
			saveRoomType(rid, value, user, card);
		}
	},
	tokenpass({ value, rid }) {
		check(value, {
			require: String,
			tokens: [{
				token: String,
				balance: String,
			}],
		});
		saveRoomTokenpass(rid, value);
	},
	streamingOptions({ value, rid }) {
		saveStreamingOptions(rid, value);
	},
	readOnly({ value, room, rid, user }) {
		if (value !== room.ro) {
			saveRoomReadOnly(rid, value, user);
		}
	},
	reactWhenReadOnly({ value, room, rid, user }) {
		if (value !== room.reactWhenReadOnly) {
			saveReactWhenReadOnly(rid, value, user);
		}
	},
	systemMessages({ value, room, rid, user }) {
		if (value !== room.sysMes) {
			saveRoomSystemMessages(rid, value, user);
		}
	},
	joinCode({ value, rid }) {
		Rooms.setJoinCodeById(rid, String(value));
	},
	default({ value, rid }) {
		Rooms.saveDefaultById(rid, value);
	},
	featured({ value, rid }) {
		Rooms.saveFeaturedById(rid, value);
	},
	retentionEnabled({ value, rid }) {
		Rooms.saveRetentionEnabledById(rid, value);
	},
	retentionMaxAge({ value, rid }) {
		Rooms.saveRetentionMaxAgeById(rid, value);
	},
	retentionExcludePinned({ value, rid }) {
		Rooms.saveRetentionExcludePinnedById(rid, value);
	},
	retentionFilesOnly({ value, rid }) {
		Rooms.saveRetentionFilesOnlyById(rid, value);
	},
	retentionIgnoreThreads({ value, rid }) {
		Rooms.saveRetentionIgnoreThreadsById(rid, value);
	},
	retentionOverrideGlobal({ value, rid }) {
		Rooms.saveRetentionOverrideGlobalById(rid, value);
	},
	encrypted({ value, rid }) {
		Rooms.saveEncryptedById(rid, value);
	},
	favorite({ value, rid }) {
		Rooms.saveFavoriteById(rid, value.favorite, value.defaultValue);
	},
	roomAvatar({ value, rid, user }) {
		setRoomAvatar(rid, value, user);
	},
};

Meteor.methods({
	saveRoomSettings(rid, cardId, settings, value) {
		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				function: 'RocketChat.saveRoomName',
			});
		}
		if (!Match.test(rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'saveRoomSettings',
			});
		}

		const card = Cards.findOneById(cardId);
		if (!card) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveRoomSettings',
			});
		}

		if (typeof settings !== 'object') {
			settings = {
				[settings]: value,
			};
		}

		if (!Object.keys(settings).every((key) => fields.includes(key))) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
				method: 'saveRoomSettings',
			});
		}

		const room = Meteor.call('canAccessRoom', rid, cardId);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'saveRoomSettings',
			});
		}

		if (room.prid) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing thread room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}

		if (!hasPermission(userId, 'edit-room', rid)) {
			if (!(Object.keys(settings).includes('encrypted') && room.t === 'd')) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			settings = { encrypted: settings.encrypted };
		}

		if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}

		const user = Meteor.user();

		// validations
		Object.keys(settings).forEach((setting) => {
			const value = settings[setting];

			const validator = validators[setting];
			if (validator) {
				validator({
					userId,
					value,
					room,
					rid,
				});
			}

			if (setting === 'retentionOverrideGlobal') {
				delete settings.retentionMaxAge;
				delete settings.retentionExcludePinned;
				delete settings.retentionFilesOnly;
				delete settings.retentionIgnoreThreads;
			}
		});

		// saving data
		Object.keys(settings).forEach((setting) => {
			const value = settings[setting];

			const saver = settingSavers[setting];
			if (saver) {
				saver({
					value,
					room,
					rid,
					user,
					card,
				});
			}
		});

		Meteor.defer(function() {
			const room = Rooms.findOneById(rid);
			callbacks.run('afterSaveRoomSettings', room);
		});

		return {
			result: true,
			rid: room._id,
		};
	},
});

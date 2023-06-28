import { Meteor } from 'meteor/meteor';
// import { Accounts } from 'meteor/accounts-base';
import _ from 'underscore';
import s from 'underscore.string';
// import { Gravatar } from 'meteor/jparker:gravatar';
// import { getRoles, hasPermission } from '../../../authorization';
import { hasPermission } from '../../../authorization';
import { /* Users, */ Cards } from '../../../models';
import { settings } from '../../../settings';
// import { checkUsernameBlocked, setCardAvatar, setCardUsername, saveCardProfiles, getAvatarSuggestionForUser } from '.';
import { checkUsernameBlocked, /* setCardAvatar, setCardImage, */ setCardUsername, saveCardProfiles } from '.';

function validateCardData(userId, cardData) {
	// const existingRoles = _.pluck(getRoles(), '_id');
	// const user = Users.findOneById(userId);

	// TODO: role & permission
	// if (cardData._id && userId !== cardData.userId && !hasPermission(userId, 'edit-other-user-info')) {
	// 	throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed', {
	// 		method: 'insertOrUpdateUser',
	// 		action: 'Editing_user',
	// 	});
	// }

	// if (!cardData._id && !hasPermission(userId, 'create-user')) {
	// 	throw new Meteor.Error('error-action-not-allowed', 'Adding user is not allowed', {
	// 		method: 'insertOrUpdateUser',
	// 		action: 'Adding_user',
	// 	});
	// }

	// if (user.roles && _.difference(user.roles, existingRoles).length > 0) {
	// 	throw new Meteor.Error('error-action-not-allowed', 'The field Roles consist invalid role name', {
	// 		method: 'insertOrUpdateUser',
	// 		action: 'Assign_role',
	// 	});
	// }

	if (!cardData._id && !s.trim(cardData.name)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Name is required', {
			method: 'insertOrUpdateUser',
			field: 'Name',
		});
	}

	if (!cardData._id && !s.trim(cardData.username)) {
		throw new Meteor.Error('error-the-field-is-required', 'The field Username is required', {
			method: 'insertOrUpdateUser',
			field: 'Username',
		});
	}

	// let nameValidation;

	// try {
	// 	nameValidation = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	// } catch (e) {
	// 	nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	// }

	// if (cardData.username && !nameValidation.test(cardData.username)) {
	// 	throw new Meteor.Error('error-input-is-not-a-valid-field', `${ _.escape(cardData.username) } is not a valid username`, {
	// 		method: 'insertOrUpdateUser',
	// 		input: cardData.username,
	// 		field: 'Username',
	// 	});
	// }

	if (!cardData._id) {
		if (checkUsernameBlocked(cardData.username)) {
			throw new Meteor.Error('error-field-unavailable', `${ _.escape(cardData.username) } is blocked`, {
				method: 'insertOrUpdateUser',
				field: cardData.username,
			});
		}
	}
}

function validateCardEditing(userId, cardData) {
	const editingMyself = cardData._id && userId === cardData.userId;
	// const user = Users.findOneById(userId);

	const canEditOtherUserInfo = hasPermission(userId, 'edit-other-user-info');

	// if (user.roles && !hasPermission(userId, 'assign-roles')) {
	// 	throw new Meteor.Error('error-action-not-allowed', 'Assign roles is not allowed', {
	// 		method: 'insertOrUpdateUser',
	// 		action: 'Assign_role',
	// 	});
	// }

	if (cardData.username && !settings.get('Accounts_AllowUsernameChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit username is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (cardData.name && !settings.get('Accounts_AllowRealNameChange') && (!canEditOtherUserInfo || editingMyself)) {
		throw new Meteor.Error('error-action-not-allowed', 'Edit user real name is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

}

export const cardPasswordHash = function(string){
	let hash = 0;
	if (string.length === 0) {
		return hash;
	}
	for (let i = 0; i < string.length; i++) {
		let char = string.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
};

export const saveCard = function(userId, cardData) {
	validateCardData(userId, cardData);
	// const user = Users.findOneById(userId);

	if (!cardData._id) {
		// insert card
		const card = Object.assign({}, cardData);
		card.userId = userId;
		delete card.profiles;

		// カード数
		let cards = Cards.findByUserId(userId).count();
		card.order = cards++;

		const _id = Cards.create(card);

		cardData._id = _id;

		// プロフィール
		if (cardData.profiles) {
			saveCardProfiles(userId, cardData._id, cardData.profiles);
		}

		return _id;
	}

	validateCardEditing(userId, cardData);

	// update card
	if (cardData.username) {
		setCardUsername(cardData._id, cardData.username);
	}

	const update = {};

	if (cardData.name) {
		update.name = cardData.name;
	}
	if (cardData.comment) {
		update.comment = cardData.comment;
	}
	if (cardData.scene) {
		update.scene = cardData.scene;
	}
	if (typeof cardData.isSecret === 'boolean') {
		update.isSecret = cardData.isSecret;
	}
	if (cardData.blocks) {
		update.blocks = cardData.blocks;
	}
	if (cardData.order) {
		update.order = cardData.order;
	}
	if (cardData.active) {
		update.active = cardData.active;
	}
	if (cardData.password) {
		update.password = cardData.password;
	}
	if (cardData.back_color) {
		update.back_color = cardData.back_color;
	}
	if (cardData.text_color) {
		update.text_color = cardData.text_color;
	}
	if (cardData.disabledOption) {
		update.disabledOption = cardData.disabledOption;
	}

	Cards.updateById(cardData._id, update);

	// プロフィール
	if (cardData.profiles) {
		// Meteor.call('saveCardProfiles', userId, cardData.profiles);
		saveCardProfiles(userId, cardData._id, cardData.profiles);
	}

	return true;
};

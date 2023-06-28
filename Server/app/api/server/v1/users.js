import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';
import Busboy from 'busboy';

import { Users, Subscriptions, Cards, Friends, EmojiCustom } from '../../../models/server';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import { getURL } from '../../../utils';
import {
	validateCustomFields,
	saveUser,
	saveCustomFieldsWithoutValidation,
	checkUsernameAvailability,
	setUserAvatar,
	saveCustomFields,
} from '../../../lib';
import { getFullUserDataByIdOrUsername } from '../../../lib/server/functions/getFullUserData';
import { API } from '../api';
import { setStatusText } from '../../../lib/server';
import { findUsersToAutocomplete } from '../lib/users';
import { getUserForCheck, emailCheck } from '../../../2fa/server/code';
import { resetUserE2EEncriptionKey } from '../../../../server/lib/resetUserE2EKey';
import { setUserStatus } from '../../../../imports/users-presence/server/activeUsers';
import { resetTOTP } from '../../../2fa/server/functions/resetTOTP';

API.v1.addRoute('users.create', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			email: String,
			name: String,
			password: String,
			username: String,
			active: Match.Maybe(Boolean),
			bio: Match.Maybe(String),
			nickname: Match.Maybe(String),
			statusText: Match.Maybe(String),
			roles: Match.Maybe(Array),
			joinDefaultChannels: Match.Maybe(Boolean),
			requirePasswordChange: Match.Maybe(Boolean),
			setRandomPassword: Match.Maybe(Boolean),
			sendWelcomeEmail: Match.Maybe(Boolean),
			verified: Match.Maybe(Boolean),
			customFields: Match.Maybe(Object),
		});

		// New change made by pull request #5152
		if (typeof this.bodyParams.joinDefaultChannels === 'undefined') {
			this.bodyParams.joinDefaultChannels = false;
		}

		if (this.bodyParams.customFields) {
			validateCustomFields(this.bodyParams.customFields);
		}

		const newUserId = saveUser(this.userId, this.bodyParams);

		if (this.bodyParams.customFields) {
			saveCustomFieldsWithoutValidation(newUserId, this.bodyParams.customFields);
		}


		if (typeof this.bodyParams.active !== 'undefined') {
			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', newUserId, this.bodyParams.active);
			});
		}

		const { fields } = this.parseJsonQuery();

		return API.v1.success({ user: Users.findOneById(newUserId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.delete', { authRequired: true }, {
	post() {
		if (!hasPermission(this.userId, 'delete-user')) {
			return API.v1.unauthorized();
		}

		const user = this.getUserFromParams();
		const { confirmRelinquish = false } = this.requestParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteUser', user._id, confirmRelinquish);
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.deleteOwnAccount', { authRequired: true }, {
	post() {
		// const { password } = this.bodyParams;
		// if (!password) {
		// 	return API.v1.failure('Body parameter "password" is required.');
		// }
		if (!settings.get('Accounts_AllowDeleteOwnAccount')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		const { confirmRelinquish = false } = this.requestParams();

		Meteor.runAsUser(this.userId, () => {
			Meteor.call('deleteUserOwnAccount', confirmRelinquish);
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.getAvatar', { authRequired: false }, {
	get() {
		const user = this.getUserFromParams();

		const url = getURL(`/avatar/${ user.username }`, { cdn: false, full: true });
		this.response.setHeader('Location', url);

		return {
			statusCode: 307,
			body: url,
		};
	},
});

API.v1.addRoute('users.setActiveStatus', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: String,
			activeStatus: Boolean,
			confirmRelinquish: Match.Maybe(Boolean),
		});

		if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(this.userId, () => {
			const { userId, activeStatus, confirmRelinquish = false } = this.bodyParams;
			Meteor.call('setUserActiveStatus', userId, activeStatus, confirmRelinquish);
		});
		return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields: { active: 1 } }) });
	},
});

API.v1.addRoute('users.deactivateIdle', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			daysIdle: Match.Integer,
			role: Match.Optional(String),
		});

		if (!hasPermission(this.userId, 'edit-other-user-active-status')) {
			return API.v1.unauthorized();
		}

		const { daysIdle, role = 'user' } = this.bodyParams;

		const lastLoggedIn = new Date();
		lastLoggedIn.setDate(lastLoggedIn.getDate() - daysIdle);

		const count = Users.setActiveNotLoggedInAfterWithRole(lastLoggedIn, role, false);

		return API.v1.success({
			count,
		});
	},
});

API.v1.addRoute('users.getPresence', { authRequired: true }, {
	get() {
		if (this.isUserFromParams()) {
			const user = Users.findOneById(this.userId);
			return API.v1.success({
				presence: user.status,
				connectionStatus: user.statusConnection,
				lastLogin: user.lastLogin,
			});
		}

		const user = this.getUserFromParams();

		return API.v1.success({
			presence: user.status,
		});
	},
});

API.v1.addRoute('users.info', { authRequired: true }, {
	get() {
		const { username, userId } = this.requestParams();
		const { fields } = this.parseJsonQuery();

		const user = getFullUserDataByIdOrUsername({ userId: this.userId, filterId: userId, filterUsername: username });

		if (!user) {
			return API.v1.failure('User not found.');
		}
		const myself = user._id === this.userId;
		if (fields.userRooms === 1 && (myself || hasPermission(this.userId, 'view-other-user-channels'))) {
			user.rooms = Subscriptions.findByUserId(user._id, {
				fields: {
					rid: 1,
					bio: 1,
					name: 1,
					t: 1,
					roles: 1,
				},
				sort: {
					t: 1,
					name: 1,
				},
			}).fetch();
		}

		return API.v1.success({
			user,
		});
	},
});

API.v1.addRoute('users.list', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'view-d-room')) {
			return API.v1.unauthorized();
		}

		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		const users = Users.find(query, {
			sort: sort || { username: 1 },
			skip: offset,
			limit: count,
			fields,
		}).fetch();

		return API.v1.success({
			users,
			count: users.length,
			offset,
			total: Users.find(query).count(),
		});
	},
});

API.v1.addRoute('users.register', { authRequired: false }, {
	post() {
		if (this.userId) {
			return API.v1.failure('Logged in users can not register again.');
		}

		// We set their username here, so require it
		// The `registerUser` checks for the other requirements
		// check(this.bodyParams, Match.ObjectIncluding({
		// 	username: String,
		// }));
		//
		// if (!checkUsernameAvailability(this.bodyParams.username)) {
		// 	return API.v1.failure('Username is already in use');
		// }

		// Register the user
		const userId = Meteor.call('registerUser', this.bodyParams);

		// Now set their username
		// Meteor.runAsUser(userId, () => Meteor.call('setUsername', this.bodyParams.username));
		// const { fields } = this.parseJsonQuery();

		return API.v1.success({ user: Users.findOneById(userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});


/**
 * メール認証
 * @param  string token メール認証トークン
 * @return bool success 成否
 * @return string userId ユーザーID
 * @return string token ログイントークン
 */
API.v1.addRoute('users.emailVerification', { authRequired: false }, {
	post() {
		const { token } = this.bodyParams;
		if (!token) {
			return API.v1.failure('The \'token\' param is required');
		}

		const invocation = new DDPCommon.MethodInvocation({
			connection: {
				close() {},
			},
		});

		const auth = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('verifyEmail', token));

		if (auth) {
			return API.v1.success({ userId: auth.id, token: auth.token });
		}

		return API.v1.failure();
	},
});

/**
 * 規約同意
 * @param  string token ログイントークン
 * @return bool success 成否
 * @return string userId ユーザーID
 * @return string token ログイントークン
 */
API.v1.addRoute('users.agreement', { authRequired: false }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			userId: Match.Maybe(String),
			token: Match.Maybe(String),
		}));
		const { userId, token } = this.bodyParams;

		const user = Users.findOneByIdAndLoginToken(userId, token);
		if (user) {
			// 同意
			Users.setAgree(userId, true);
			return API.v1.success();
		}

		return API.v1.failure();
	},
});

API.v1.addRoute('users.resetAvatar', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();

		if (user._id === this.userId) {
			Meteor.runAsUser(this.userId, () => Meteor.call('resetAvatar'));
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			Meteor.runAsUser(user._id, () => Meteor.call('resetAvatar'));
		} else {
			return API.v1.unauthorized();
		}

		return API.v1.success();
	},
});

API.v1.addRoute('users.setAvatar', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			avatarUrl: Match.Maybe(String),
			userId: Match.Maybe(String),
			username: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserAvatarChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change avatar is not allowed', {
				method: 'users.setAvatar',
			});
		}

		let user;
		if (this.isUserFromParams()) {
			user = Meteor.users.findOne(this.userId);
		} else if (hasPermission(this.userId, 'edit-other-user-avatar')) {
			user = this.getUserFromParams();
		} else {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.avatarUrl) {
				setUserAvatar(user, this.bodyParams.avatarUrl, '', 'url');
			} else {
				const busboy = new Busboy({ headers: this.request.headers });
				const fields = {};
				const getUserFromFormData = (fields) => {
					if (fields.userId) {
						return Users.findOneById(fields.userId, { _id: 1 });
					}
					if (fields.username) {
						return Users.findOneByUsernameIgnoringCase(fields.username, { _id: 1 });
					}
				};

				Meteor.wrapAsync((callback) => {
					busboy.on('file', Meteor.bindEnvironment((fieldname, file, filename, encoding, mimetype) => {
						if (fieldname !== 'image') {
							return callback(new Meteor.Error('invalid-field'));
						}
						const imageData = [];
						file.on('data', Meteor.bindEnvironment((data) => {
							imageData.push(data);
						}));

						file.on('end', Meteor.bindEnvironment(() => {
							const sentTheUserByFormData = fields.userId || fields.username;
							if (sentTheUserByFormData) {
								user = getUserFromFormData(fields);
								if (!user) {
									return callback(new Meteor.Error('error-invalid-user', 'The optional "userId" or "username" param provided does not match any users'));
								}
								const isAnotherUser = this.userId !== user._id;
								if (isAnotherUser && !hasPermission(this.userId, 'edit-other-user-info')) {
									return callback(new Meteor.Error('error-not-allowed', 'Not allowed'));
								}
							}
							try {
								setUserAvatar(user, Buffer.concat(imageData), mimetype, 'rest');
								callback();
							} catch (e) {
								callback(e);
							}
						}));
					}));
					busboy.on('field', (fieldname, val) => {
						fields[fieldname] = val;
					});
					this.request.pipe(busboy);
				})();
			}
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.getStatus', { authRequired: true }, {
	get() {
		if (this.isUserFromParams()) {
			const user = Users.findOneById(this.userId);
			return API.v1.success({
				_id: user._id,
				message: user.statusText,
				connectionStatus: user.statusConnection,
				status: user.status,
			});
		}

		const user = this.getUserFromParams();

		return API.v1.success({
			_id: user._id,
			message: user.statusText,
			status: user.status,
		});
	},
});

API.v1.addRoute('users.setStatus', { authRequired: true }, {
	post() {
		check(this.bodyParams, Match.ObjectIncluding({
			status: Match.Maybe(String),
			message: Match.Maybe(String),
		}));

		if (!settings.get('Accounts_AllowUserStatusMessageChange')) {
			throw new Meteor.Error('error-not-allowed', 'Change status is not allowed', {
				method: 'users.setStatus',
			});
		}

		let user;
		if (this.isUserFromParams()) {
			user = Meteor.users.findOne(this.userId);
		} else if (hasPermission(this.userId, 'edit-other-user-info')) {
			user = this.getUserFromParams();
		} else {
			return API.v1.unauthorized();
		}

		Meteor.runAsUser(user._id, () => {
			if (this.bodyParams.message || this.bodyParams.message === '') {
				setStatusText(user._id, this.bodyParams.message);
			}
			if (this.bodyParams.status) {
				const validStatus = ['online', 'away', 'offline', 'busy'];
				if (validStatus.includes(this.bodyParams.status)) {
					const { status } = this.bodyParams;
					Meteor.users.update(user._id, {
						$set: {
							status,
							statusDefault: status,
						},
					});
					setUserStatus(user, status);
				} else {
					throw new Meteor.Error('error-invalid-status', 'Valid status types include online, away, offline, and busy.', {
						method: 'users.setStatus',
					});
				}
			}
		});

		return API.v1.success();
	},
});

API.v1.addRoute('users.update', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: String,
			data: Match.ObjectIncluding({
				email: Match.Maybe(String),
				name: Match.Maybe(String),
				password: Match.Maybe(String),
				username: Match.Maybe(String),
				bio: Match.Maybe(String),
				nickname: Match.Maybe(String),
				statusText: Match.Maybe(String),
				active: Match.Maybe(Boolean),
				roles: Match.Maybe(Array),
				joinDefaultChannels: Match.Maybe(Boolean),
				requirePasswordChange: Match.Maybe(Boolean),
				sendWelcomeEmail: Match.Maybe(Boolean),
				verified: Match.Maybe(Boolean),
				customFields: Match.Maybe(Object),
			}),
		});

		const userData = _.extend({ _id: this.bodyParams.userId }, this.bodyParams.data);

		Meteor.runAsUser(this.userId, () => saveUser(this.userId, userData));

		if (this.bodyParams.data.customFields) {
			saveCustomFields(this.bodyParams.userId, this.bodyParams.data.customFields);
		}

		if (typeof this.bodyParams.data.active !== 'undefined') {
			const { userId, data: { active }, confirmRelinquish = false } = this.bodyParams;

			Meteor.runAsUser(this.userId, () => {
				Meteor.call('setUserActiveStatus', userId, active, confirmRelinquish);
			});
		}
		//const { fields } = this.parseJsonQuery();

		return API.v1.success({ user: Users.findOneById(this.bodyParams.userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.updateOwnBasicInfo', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			data: Match.ObjectIncluding({
				email: Match.Maybe(String),
				name: Match.Maybe(String),
				username: Match.Maybe(String),
				nickname: Match.Maybe(String),
				statusText: Match.Maybe(String),
				currentPassword: Match.Maybe(String),
				newPassword: Match.Maybe(String),
			}),
			customFields: Match.Maybe(Object),
		});

		const userData = {
			email: this.bodyParams.data.email,
			realname: this.bodyParams.data.name,
			username: this.bodyParams.data.username,
			nickname: this.bodyParams.data.nickname,
			statusText: this.bodyParams.data.statusText,
			newPassword: this.bodyParams.data.newPassword,
			typedPassword: this.bodyParams.data.currentPassword,
		};

		Meteor.runAsUser(this.userId, () => Meteor.call('saveUserProfile', userData, this.bodyParams.customFields));

		return API.v1.success({ user: Users.findOneById(this.userId, { fields: API.v1.defaultFieldsToExclude }) });
	},
});

API.v1.addRoute('users.createToken', { authRequired: true }, {
	post() {
		const user = this.getUserFromParams();
		let data;
		Meteor.runAsUser(this.userId, () => {
			data = Meteor.call('createToken', user._id);
		});
		return data ? API.v1.success({ data }) : API.v1.unauthorized();
	},
});

API.v1.addRoute('users.getPreferences', { authRequired: true }, {
	get() {
		const user = Users.findOneById(this.userId);
		if (user.settings) {
			const { preferences = {} } = user.settings;
			preferences.language = user.language;

			return API.v1.success({
				preferences,
			});
		}
		return API.v1.failure(TAPi18n.__('Accounts_Default_User_Preferences_not_available').toUpperCase());
	},
});

API.v1.addRoute('users.setPreferences', { authRequired: true }, {
	post() {
		check(this.bodyParams, {
			userId: Match.Maybe(String),
			data: Match.ObjectIncluding({
				newRoomNotification: Match.Maybe(String),
				newMessageNotification: Match.Maybe(String),
				clockMode: Match.Maybe(Number),
				useEmojis: Match.Maybe(Boolean),
				convertAsciiEmoji: Match.Maybe(Boolean),
				saveMobileBandwidth: Match.Maybe(Boolean),
				collapseMediaByDefault: Match.Maybe(Boolean),
				autoImageLoad: Match.Maybe(Boolean),
				emailNotificationMode: Match.Maybe(String),
				unreadAlert: Match.Maybe(Boolean),
				notificationsSoundVolume: Match.Maybe(Number),
				desktopNotifications: Match.Maybe(String),
				mobileNotifications: Match.Maybe(String),
				enableAutoAway: Match.Maybe(Boolean),
				highlights: Match.Maybe(Array),
				desktopNotificationRequireInteraction: Match.Maybe(Boolean),
				messageViewMode: Match.Maybe(Number),
				showMessageInMainThread: Match.Maybe(Boolean),
				hideUsernames: Match.Maybe(Boolean),
				hideRoles: Match.Maybe(Boolean),
				hideAvatars: Match.Maybe(Boolean),
				hideFlexTab: Match.Maybe(Boolean),
				sendOnEnter: Match.Maybe(String),
				language: Match.Maybe(String),
				sidebarShowFavorites: Match.Optional(Boolean),
				sidebarShowUnread: Match.Optional(Boolean),
				sidebarSortby: Match.Optional(String),
				sidebarViewMode: Match.Optional(String),
				sidebarHideAvatar: Match.Optional(Boolean),
				sidebarGroupByType: Match.Optional(Boolean),
				sidebarShowDiscussion: Match.Optional(Boolean),
				muteFocusedConversations: Match.Optional(Boolean),
			}),
		});
		if (this.bodyParams.userId && this.bodyParams.userId !== this.userId && !hasPermission(this.userId, 'edit-other-user-info')) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing user is not allowed');
		}
		const userId = this.bodyParams.userId ? this.bodyParams.userId : this.userId;
		if (!Users.findOneById(userId)) {
			throw new Meteor.Error('error-invalid-user', 'The optional "userId" param provided does not match any users');
		}

		Meteor.runAsUser(userId, () => Meteor.call('saveUserPreferences', this.bodyParams.data));
		const user = Users.findOneById(userId, {
			fields: {
				'settings.preferences': 1,
				language: 1,
			},
		});
		return API.v1.success({
			user: {
				_id: user._id,
				settings: {
					preferences: {
						...user.settings.preferences,
						language: user.language,
					},
				},
			},
		});
	},
});

/**
 * アカウント登録認証メールの送信（認証の有効期限が切れたユーザー向け）
 *
 * @param String email メールアドレス
 * @return success
 */
API.v1.addRoute('users.sendRegisterEmail', { authRequired: false }, {
	post() {
		const { email } = this.bodyParams;
		if (!email) {
			return API.v1.failure('The \'email\' param is required');
		}

		user = Users.findOneByEmailAddress(email);
		if (user && user.emails && user.emails[0] && user.emails[0].verified === false) {
			const emailSent = Meteor.call('sendRegisterEmail', email);
			if (emailSent) {
				return API.v1.success();
			}
			return API.v1.failure('Failed to send email');
		}
		return API.v1.failure('User not a target');
	},
});

API.v1.addRoute('users.setDeviceInfo', { authRequired: true }, {
	post() {
		const {deviceInfo} = this.bodyParams;
		if (deviceInfo) {
			Users.update({
				_id: Meteor.userId(),
			}, {
				$set : {
					deviceInfo
				}
			});
			return API.v1.success();
		}
		else{
			return API.v1.failure('The \'deviceInfo\' param is required');
		}
	}
});

API.v1.addRoute('users.forgotPassword', { authRequired: false }, {
	post() {
		const { email } = this.bodyParams;
		if (!email) {
			return API.v1.failure('The \'email\' param is required');
		}

		Meteor.call('sendForgotPasswordEmail', email);
		return API.v1.success();
	},
});

/**
 * ユーザーのパスワードを設定する
 *
 * @param String password ユーザー名
 * @param String token トークン（オプション）
 * @return success
 */
API.v1.addRoute('users.resetPassword', { authRequired: false }, {
	post() {
		check(this.bodyParams, {
			password: String,
			token: Match.Maybe(String),
		});

		if (this.userId && !this.bodyParams.token) {
			Meteor.runAsUser(this.userId, () => Meteor.call('setUserPassword', this.bodyParams.password));
			return API.v1.success();
		} else {
			const invocation = new DDPCommon.MethodInvocation({
				connection: {
					close() {},
				},
			});

			// const result = DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('resetPassword', this.bodyParams.token, this.bodyParams.password));
			DDP._CurrentInvocation.withValue(invocation, () => Meteor.call('resetPassword', this.bodyParams.token, this.bodyParams.password));
			// Accounts.resetPassword(this.bodyParams.token, this.bodyParams.password, function(error) {
			// 	return API.v1.failure();
			// });
			return API.v1.success();
		}
	},
});

API.v1.addRoute('users.getUsernameSuggestion', { authRequired: true }, {
	get() {
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('getUsernameSuggestion'));

		return API.v1.success({ result });
	},
});

API.v1.addRoute('users.generatePersonalAccessToken', { authRequired: true, twoFactorRequired: true }, {
	post() {
		const { tokenName, bypassTwoFactor } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:generateToken', { tokenName, bypassTwoFactor }));

		return API.v1.success({ token });
	},
});

API.v1.addRoute('users.regeneratePersonalAccessToken', { authRequired: true, twoFactorRequired: true }, {
	post() {
		const { tokenName } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		const token = Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:regenerateToken', { tokenName }));

		return API.v1.success({ token });
	},
});

API.v1.addRoute('users.getPersonalAccessTokens', { authRequired: true }, {
	get() {
		if (!hasPermission(this.userId, 'create-personal-access-tokens')) {
			throw new Meteor.Error('not-authorized', 'Not Authorized');
		}
		const loginTokens = Users.getLoginTokensByUserId(this.userId).fetch()[0];
		const getPersonalAccessTokens = () => loginTokens.services.resume.loginTokens
			.filter((loginToken) => loginToken.type && loginToken.type === 'personalAccessToken')
			.map((loginToken) => ({
				name: loginToken.name,
				createdAt: loginToken.createdAt,
				lastTokenPart: loginToken.lastTokenPart,
				bypassTwoFactor: loginToken.bypassTwoFactor,
			}));

		return API.v1.success({
			tokens: loginTokens ? getPersonalAccessTokens() : [],
		});
	},
});

API.v1.addRoute('users.removePersonalAccessToken', { authRequired: true, twoFactorRequired: true }, {
	post() {
		const { tokenName } = this.bodyParams;
		if (!tokenName) {
			return API.v1.failure('The \'tokenName\' param is required');
		}
		Meteor.runAsUser(this.userId, () => Meteor.call('personalAccessTokens:removeToken', {
			tokenName,
		}));

		return API.v1.success();
	},
});

API.v1.addRoute('users.2fa.enableEmail', { authRequired: true }, {
	post() {
		Users.enableEmail2FAByUserId(this.userId);

		return API.v1.success();
	},
});

API.v1.addRoute('users.2fa.disableEmail', { authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } }, {
	post() {
		Users.disableEmail2FAByUserId(this.userId);

		return API.v1.success();
	},
});

API.v1.addRoute('users.2fa.sendEmailCode', {
	post() {
		const { emailOrUsername } = this.bodyParams;

		if (!emailOrUsername) {
			throw new Meteor.Error('error-parameter-required', 'emailOrUsername is required');
		}

		const method = emailOrUsername.includes('@') ? 'findOneByEmailAddress' : 'findOneByUsername';
		const userId = this.userId || Users[method](emailOrUsername, { fields: { _id: 1 } })?._id;

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		emailCheck.sendEmailCode(getUserForCheck(userId));

		return API.v1.success();
	},
});

API.v1.addRoute('users.presence', { authRequired: true }, {
	get() {
		const { from, ids } = this.queryParams;

		const options = {
			fields: {
				username: 1,
				name: 1,
				status: 1,
				utcOffset: 1,
				statusText: 1,
				avatarETag: 1,
			},
		};

		if (ids) {
			return API.v1.success({
				users: Users.findNotOfflineByIds(Array.isArray(ids) ? ids : ids.split(','), options).fetch(),
				full: false,
			});
		}

		if (from) {
			const ts = new Date(from);
			const diff = (Date.now() - ts) / 1000 / 60;

			if (diff < 10) {
				return API.v1.success({
					users: Users.findNotIdUpdatedFrom(this.userId, ts, options).fetch(),
					full: false,
				});
			}
		}

		return API.v1.success({
			users: Users.findUsersNotOffline(options).fetch(),
			full: true,
		});
	},
});

API.v1.addRoute('users.requestDataDownload', { authRequired: true }, {
	get() {
		const { fullExport = false } = this.queryParams;
		const result = Meteor.runAsUser(this.userId, () => Meteor.call('requestDataDownload', { fullExport: fullExport === 'true' }));

		return API.v1.success({
			requested: result.requested,
			exportOperation: result.exportOperation,
		});
	},
});

API.v1.addRoute('users.logoutOtherClients', { authRequired: true }, {
	post() {
		try {
			const result = Meteor.call('logoutOtherClients');

			return API.v1.success(result);
		} catch (error) {
			return API.v1.failure(error);
		}
	},
});

API.v1.addRoute('users.autocomplete', { authRequired: true }, {
	get() {
		const { selector } = this.queryParams;

		if (!selector) {
			return API.v1.failure('The \'selector\' param is required');
		}

		return API.v1.success(Promise.await(findUsersToAutocomplete({
			uid: this.userId,
			selector: JSON.parse(selector),
		})));
	},
});

API.v1.addRoute('users.removeOtherTokens', { authRequired: true }, {
	post() {
		API.v1.success(Meteor.call('removeOtherTokens'));
	},
});

API.v1.addRoute('users.resetE2EKey', { authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } }, {
	post() {
		// reset own keys
		if (this.isUserFromParams()) {
			resetUserE2EEncriptionKey(this.userId, false);
			return API.v1.success();
		}

		// reset other user keys
		const user = this.getUserFromParams();
		if (!user) {
			throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
		}

		if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		if (!hasPermission(Meteor.userId(), 'edit-other-user-e2ee')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		if (!resetUserE2EEncriptionKey(user._id, true)) {
			return API.v1.failure();
		}

		return API.v1.success();
	},
});

API.v1.addRoute('users.resetTOTP', { authRequired: true, twoFactorRequired: true, twoFactorOptions: { disableRememberMe: true } }, {
	post() {
		// reset own keys
		if (this.isUserFromParams()) {
			Promise.await(resetTOTP(this.userId, false));
			return API.v1.success();
		}

		// reset other user keys
		const user = this.getUserFromParams();
		if (!user) {
			throw new Meteor.Error('error-invalid-user-id', 'Invalid user id');
		}

		if (!settings.get('Accounts_TwoFactorAuthentication_Enforce_Password_Fallback')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		if (!hasPermission(Meteor.userId(), 'edit-other-user-totp')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed');
		}

		Promise.await(resetTOTP(user._id, true));

		return API.v1.success();
	},
});

/**
 * ユーザーのカード一覧を取得する
 * @return cards カード情報一覧
 */
API.v1.addRoute('users.cards', { authRequired: true }, {
	get() {
		let cards = Cards.findByUserId(this.userId).fetch();
		if (!Array.isArray(cards)) {
			cards = [];
		}
		// TODO： 未読


		return API.v1.success({ cards });
	},
});

/**
 * ユーザーの友達一覧を取得する
 * @return friends 友達一覧
 */
API.v1.addRoute('users.friends', { authRequired: true }, {
	get() {
		let friends = Friends.findByUserId(this.userId).fetch();
		if (!Array.isArray(friends)) {
			friends = [];
		}

		// let cards = Cards.findByCardIds(this.bodyParams.cardIds, { sort : {order: 1} }).fetch();

		return API.v1.success({ friends });
	},
});

/**
 * ユーザーのお気に入り一覧を取得する
 * @return favorites お気に入り一覧
 */
// API.v1.addRoute('users.favorites', { authRequired: true }, {
// 	get() {
// 		let friends = Friends.findByUserId(this.userId).fetch();
// 		if (Array.isArray(friends)) {
// 			friends = [];
// 		}
// 		return API.v1.success({ friends });
// 	},
// });

/**
 *
 */
API.v1.addRoute('users.addEmoji', {authRequired: true }, {
	post(){
		const { id, is_gift } = this.bodyParams;
		if(!id){
			return API.v1.failure('The \'Emoji ID\' param is required');
		}

		const emoji = EmojiCustom.findOneById(id);
		const me = Users.findOneById(Meteor.userId());
		if(!emoji){
			return API.v1.failure('The \'Emoji ID\' param is invalid');
		}
		if(!is_gift && emoji.points && emoji.points > (me.points??0)){
			return API.v1.failure('Points are not enough.');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('addEmojiToUser', emoji, is_gift));

		return API.v1.success();
	}
});

API.v1.addRoute('users.removeEmoji', {authRequired: true }, {
	post(){
		const { id } = this.bodyParams;
		if(!id){
			return API.v1.failure('The \'Emoji ID\' param is required');
		}

		const emoji = EmojiCustom.findOneById(id);
		if(!emoji){
			return API.v1.failure('The \'Emoji ID\' param is invalid');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('removeEmojiToUser', id));

		return API.v1.success();
	}
});

API.v1.addRoute('users.giftEmoji', {authRequired: true }, {
	post(){
		const { id, chats, name } = this.bodyParams;
		if(!id){
			return API.v1.failure('The \'Emoji ID\' param is required');
		}

		const emoji = EmojiCustom.findOneById(id);
		if(!emoji){
			return API.v1.failure('The \'Emoji ID\' param is invalid');
		}

		Meteor.runAsUser(this.userId, () => Meteor.call('giftEmojiToOthers', id, emoji, chats, name));

		return API.v1.success();
	}
});

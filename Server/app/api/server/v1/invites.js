import { Meteor } from 'meteor/meteor';

import { API } from '../api';
import { findOrCreateInvite } from '../../../invites/server/functions/findOrCreateInvite';
import { removeInvite } from '../../../invites/server/functions/removeInvite';
import { listInvites } from '../../../invites/server/functions/listInvites';
import { useInviteToken } from '../../../invites/server/functions/useInviteToken';
import { validateInviteToken } from '../../../invites/server/functions/validateInviteToken';
import { inviteWithMail } from '../../../invites/server/functions/inviteWithMail';
import { inviteWithCId } from '../../../invites/server/functions/inviteWithCId';

API.v1.addRoute('listInvites', { authRequired: true }, {
	get() {
		const result = listInvites(this.userId);
		return API.v1.success(result);
	},
});

API.v1.addRoute('findOrCreateInvite', { authRequired: true }, {
	post() {
		const { rid, days, maxUses } = this.bodyParams;
		const result = findOrCreateInvite(this.userId, { rid, days, maxUses });

		return API.v1.success(result);
	},
});

API.v1.addRoute('removeInvite/:_id', { authRequired: true }, {
	delete() {
		const { _id } = this.urlParams;
		const result = removeInvite(this.userId, { _id });

		return API.v1.success(result);
	},
});

API.v1.addRoute('useInviteToken', { authRequired: true }, {
	post() {
		const { token } = this.bodyParams;
		// eslint-disable-next-line react-hooks/rules-of-hooks
		const result = useInviteToken(this.userId, token);

		return API.v1.success(result);
	},
});

API.v1.addRoute('validateInviteToken', { authRequired: false }, {
	post() {
		const { token } = this.bodyParams;

		if (!token) {
			throw new Meteor.Error('error-invalid-token', 'The invite token is invalid.', { method: 'validateInviteToken', field: 'token' });
		}

		let valid = true;
		try {
			validateInviteToken(token);
		} catch (e) {
			valid = false;
		}

		return API.v1.success({ valid });
	},
});

/**
 * InviteWithEmail
 */
API.v1.addRoute('inviteWithMail', { authRequired: true }, {
	post() {
		const { email } = this.bodyParams;
		const result = inviteWithMail(email);

		return API.v1.success({success: result});
	},
});

/**
 * todo -> unused this function. send notification after invite friend with CardID.
 * InviteWithCId (Card`s ID)
 */
API.v1.addRoute('inviteWithCId', { authRequired: true }, {
	post() {
		const { fromCardId, toCId } = this.bodyParams;
		const result = inviteWithCId(fromCardId, toCId);

		return API.v1.success({success: result});
	},
});

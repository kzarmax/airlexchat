import { Meteor } from 'meteor/meteor';
import crypto from 'crypto';
import { API } from '../api';

API.v1.addRoute('e2e.fetchMyKeys', { authRequired: true }, {
	get() {
		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('e2e.fetchMyKeys'); });

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.getUsersOfRoomWithoutKey', { authRequired: true }, {
	get() {
		const { rid } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => { result = Meteor.call('e2e.getUsersOfRoomWithoutKey', rid); });

		return API.v1.success(result);
	},
});

API.v1.addRoute('e2e.setRoomKeyID', { authRequired: true }, {
	post() {
		const { rid, keyID } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.setRoomKeyID', rid, keyID));
		});

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.decryptByNodeJSCrypto', { authRequired: true }, {
	post() {
		const { encrypted, private_key } = this.bodyParams;
		const privateKey = crypto.createPrivateKey({
			key: private_key,
			format: 'pem',
			type: 'pkcs1',
		});
		try {
			const decrypted = crypto.privateDecrypt({
				key: privateKey,
				oaepHash: 'sha256',
			}, Buffer.from(encrypted, 'base64')).toString();
			return API.v1.success({ decrypted });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});

API.v1.addRoute('e2e.setUserPublicAndPrivateKeys', { authRequired: true }, {
	post() {
		const { public_key, private_key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.setUserPublicAndPrivateKeys', {
				public_key,
				private_key,
			}));
		});

		return API.v1.success();
	},
});

API.v1.addRoute('e2e.updateGroupKey', { authRequired: true }, {
	post() {
		const { uid, rid, key } = this.bodyParams;

		Meteor.runAsUser(this.userId, () => {
			API.v1.success(Meteor.call('e2e.updateGroupKey', rid, uid, key));
		});

		return API.v1.success();
	},
});

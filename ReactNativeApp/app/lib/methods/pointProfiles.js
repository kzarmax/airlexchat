import { InteractionManager } from 'react-native';
import semver from 'semver';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import database from '../database';
import log, { LOG_L_LOW } from '../../utils/log';
import { setPointProfiles as setPointProfilesAction } from '../../actions/pointProfiles';

const getUpdatedSince = (allProfiles) => {
	if (!allProfiles.length) {
		return null;
	}
	const ordered = orderBy(allProfiles.filter(item => item._updatedAt !== null), ['_updatedAt'], ['desc']);
	return ordered && ordered[0]._updatedAt.toISOString();
};

const updateProfiles = async({ update = [], remove = [], allRecords }) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const pointProfileCollection = db.collections.get('point_profiles');
	let profilesToCreate = [];
	let profilesToUpdate = [];
	let profilesToDelete = [];

	// Create or update
	if (update && update.length) {
		profilesToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		profilesToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		profilesToCreate = profilesToCreate.map(profile => pointProfileCollection.prepareCreate((e) => {
			e._raw = sanitizedRaw({ id: profile._id }, pointProfileCollection.schema);
			Object.assign(e, profile);
		}));
		profilesToUpdate = profilesToUpdate.map((profile) => {
			const newProfile = update.find(e => e._id === profile.id);
			return profile.prepareUpdate((e) => {
				Object.assign(e, newProfile);
			});
		});
	}

	if (remove && remove.length) {
		profilesToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		profilesToDelete = profilesToDelete.map(profile => profile.prepareDestroyPermanently());
	}

	try {
		await db.action(async() => {
			await db.batch(
				...profilesToCreate,
				...profilesToUpdate,
				...profilesToDelete
			);
		});
		return true;
	} catch (e) {
		log(e);
	}
};

export async function setPointProfiles() {
	try {
		const db = database.active;
		const pointProfileCollection = db.collections.get('point_profiles');

		const pointProfiles = await pointProfileCollection.query().fetch();

		let parsed = [];
		for(const pointProfile of pointProfiles){
			const { id, points, price } = pointProfile;
			const profile = {
				id: id,
				points: points,
				price: price,
			};
			parsed.push(profile);
		}

		reduxStore.dispatch(setPointProfilesAction(parsed));
	} catch (e) {
		log(e);
	}
}

export function getPointProfiles() {
	return new Promise(async(resolve) => {
		try {
			const db = database.active;
			const pointProfileCollection = db.collections.get('point_profiles');
			const allRecords = await pointProfileCollection.query().fetch();
			const updatedSince = await getUpdatedSince(allRecords);

			const params = {};
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}

			// RC 0.75.0
			const result = await this.sdk.get('point-profile.list', params);

			if (!result.success) {
				return resolve();
			}

			InteractionManager.runAfterInteractions(async() => {
				const { profiles } = result;
				const { update, remove } = profiles;
				const changedProfiles = await updateProfiles({ update, remove, allRecords });

				// `setCustomEmojis` is fired on selectServer
				// We run it again only if emojis were changed
				if (changedProfiles) {
					await setPointProfiles();
				}
			});

		} catch (e) {
			log(e);
			return resolve();
		}
	});
}

export async function purchasedPoints( points, price ){
	try {
		const result = await this.sdk.post('point-purchased', { points, price });
		if(!result.success){
			LOG_L_LOW('points Purchased', result);
		} else {
			LOG_L_LOW('err_purchased_points', result);
		}
	} catch (e) {
		log(e);
	}
}

import { InteractionManager } from 'react-native';
import orderBy from 'lodash/orderBy';
import { sanitizedRaw } from '@nozbe/watermelondb/RawRecord';

import reduxStore from '../createStore';
import database from '../database';
import { Q } from '@nozbe/watermelondb';
import log from '../../utils/log';
import { setCustomEmojis as setCustomEmojisAction } from '../../actions/customEmojis';

const getUpdatedSince = (allEmojis) => {
	if (!allEmojis.length) {
		return null;
	}
	const ordered = orderBy(allEmojis.filter(item => item._updatedAt !== null), ['_updatedAt'], ['desc']);
	return ordered && ordered[0]._updatedAt.toISOString();
};

const updateEmojis = async({ update = [], remove = [], allRecords }) => {
	if (!((update && update.length) || (remove && remove.length))) {
		return;
	}
	const db = database.active;
	const emojisCollection = db.collections.get('custom_emojis');
	let emojisToCreate = [];
	let emojisToUpdate = [];
	let emojisToDelete = [];

	update = update.map(item => {
		if(!item.parent || item.parent==="0"){
			item.parent = '';
		}
		return item;
	})

	// Create or update
	if (update && update.length) {
		emojisToCreate = update.filter(i1 => !allRecords.find(i2 => i1._id === i2.id));
		emojisToUpdate = allRecords.filter(i1 => update.find(i2 => i1.id === i2._id));
		emojisToCreate = emojisToCreate.map(emoji => emojisCollection.prepareCreate((e) => {
			e._raw = sanitizedRaw({ id: emoji._id }, emojisCollection.schema);
			Object.assign(e, emoji);
		}));
		emojisToUpdate = emojisToUpdate.map((emoji) => {
			const newEmoji = update.find(e => e._id === emoji.id);
			return emoji.prepareUpdate((e) => {
				Object.assign(e, newEmoji);
			});
		});
	}

	if (remove && remove.length) {
		emojisToDelete = allRecords.filter(i1 => remove.find(i2 => i1.id === i2._id));
		emojisToDelete = emojisToDelete.map(emoji => emoji.prepareDestroyPermanently());
	}

	try {
		await db.action(async() => {
			await db.batch(
				...emojisToCreate,
				...emojisToUpdate,
				...emojisToDelete
			);
		});
		return true;
	} catch (e) {
		log(e, 'Custom Emoji Update Error:')
	}
};

export async function setCustomEmojis() {
	try {
		const db = database.active;
		const emojisCollection = db.collections.get('custom_emojis');
		const pEmojis = await emojisCollection.query(Q.where('parent', Q.oneOf(['','0']))).fetch();

		let parsed = [];
		for(const pEmoji of pEmojis){
			const { id, name, aliases, extension, parent, creator, points } = pEmoji;
			const emojiCategory = {
				id: id,
				name: name,
				creator: creator??null,
				alias: aliases,
				extension: extension,
				points: points??0,
				children: {}
			};

			const children = await emojisCollection.query(Q.where('parent', id)).fetch();

			children.forEach((item) => {
				emojiCategory.children[item.name] = {
					id: item.id,
					name: item.name,
					alias: item.aliases,
					extension: item.extension
				};
			});

			parsed.push(emojiCategory);
		}

		reduxStore.dispatch(setCustomEmojisAction(parsed));
	} catch (e) {
		log(e, 'Set CustomEmoji Error: ');
	}
}

export function getCustomEmojis() {
	return new Promise(async(resolve) => {
		try {
			const db = database.active;
			const emojisCollection = db.collections.get('custom_emojis');
			const allRecords = await emojisCollection.query().fetch();
			const updatedSince = await getUpdatedSince(allRecords);

			const params = {};
			if (updatedSince) {
				params.updatedSince = updatedSince;
			}

			const result = await this.sdk.get('emoji-custom.list', params);

			if (!result.success) {
				return resolve();
			}

			InteractionManager.runAfterInteractions(async() => {
				const { emojis } = result;
				const { update, remove } = emojis;
				const changedEmojis = await updateEmojis({ update, remove, allRecords });

				// `setCustomEmojis` is fired on selectServer
				// We run it again only if emojis were changed
				if (changedEmojis) {
					setCustomEmojis();
				}
			});

		} catch (e) {
			log(e);
			return resolve();
		}
	});
}

import { Base } from './_Base';

class EmojiCustom extends Base {
	constructor() {
		super('custom_emoji');

		this.tryEnsureIndex({ name: 1 });
		this.tryEnsureIndex({ aliases: 1 });
		this.tryEnsureIndex({ extension: 1 });
		this.tryEnsureIndex({ parent: 1 });
	}

	// find one
	findOneById(_id, options) {
		return this.findOne(_id, options);
	}

	// find
	findByNameOrAlias(emojiName, options) {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [
				{ name },
				{ aliases: name },
			],
		};

		return this.find(query, options);
	}

	findByNameOrAliasExceptID(name, except, options) {
		const query = {
			_id: { $nin: [except] },
			$or: [
				{ name },
				{ aliases: name },
			],
		};

		return this.find(query, options);
	}


	// update
	setName(_id, name) {
		const update = {
			$set: {
				name,
			},
		};

		return this.update({ _id }, update);
	}

	setAliases(_id, aliases) {
		const update = {
			$set: {
				aliases,
			},
		};

		return this.update({ _id }, update);
	}

	setExtension(_id, extension) {
		const update = {
			$set: {
				extension,
			},
		};

		return this.update({ _id }, update);
	}

	setParent(_id, parent) {
		const update = {
			$set: {
				parent,
			},
		};

		return this.update({ _id }, update);
	}

	setPoints(_id, points) {
		const update = {
			$set: {
				points,
			},
		};

		return this.update({ _id }, update);
	}

	// INSERT
	create(data) {
		return this.insert(data);
	}


	// REMOVE
	removeById(_id) {
		return this.remove(_id);
	}
}

export default new EmojiCustom();

export default class BaseRepository {
	#database;

	#softDelete = true;

	#collectionName;

	constructor({ collectionName, database, softDelete }) {
		if (!collectionName) throw new Error('COLLECTION_NAME_UNDEFINED');
		if (!database) throw new Error('DATABASE_UNDEFINED');
		if (typeof softDelete === 'boolean') this.#softDelete = softDelete;
		this.#database = database;
		this.#collectionName = collectionName;
	}

	async insert({ state }) {
		const res = await this.#database.insertOne({
			collectionName: this.#collectionName,
			entity: state,
		});
		return res;
	}

	async update({ state }) {
		const update = { $set: {} };
		Object.keys(state).forEach((key) => {
			if (key !== 'id' && key !== '_id') update.$set[`${key}`] = state[`${key}`];
		});
		const res = await this.#database.updateOne({
			collectionName: this.#collectionName,
			filter: { id: state.id },
			update,
		});
		return res;
	}

	async delete({ state }) {
		let res;
		if (this.#softDelete) {
			res = await this.#database.deleteById({
				collectionName: this.#collectionName,
				id: state.id,
			});
		} else {
			res = await this.#database.updateOne({
				collectionName: this.#collectionName,
				filter: { id: state.id },
				update: { $set: { active: false } },
			});
		}
		return res;
	}

	db() {
		return this.#database;
	}

	collectionName() {
		return this.#collectionName;
	}
}

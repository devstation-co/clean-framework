export default class BaseRepository {
	#database;

	#softDelete = true;

	constructor({ collectionName, database, softDelete }) {
		if (softDelete === undefined || softDelete === null) throw new Error('SOFT_DELETE_UNDEFINED');
		this.#database = database;
		this.#softDelete = softDelete;
		this.collectionName = collectionName;
	}

	async insert({ state }) {
		const res = await this.#database.insertOne({
			collectionName: this.collectionName,
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
			collectionName: this.collectionName,
			filter: { id: state.id },
			update,
		});
		return res;
	}

	async delete({ id }) {
		const res = await this.#database.deleteById({
			collectionName: this.collectionName,
			id,
		});
		return res;
	}

	db() {
		return this.#database;
	}
}

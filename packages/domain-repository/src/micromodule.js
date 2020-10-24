export default class BaseRepository {
	#database;

	constructor({ collectionName, database }) {
		this.#database = database;
		this.collectionName = collectionName;
	}

	async save({ state }) {
		const res = await this.#database.findById({
			collectionName: this.collectionName,
			id: state.id,
		});
		if (res) {
			await this.update({ state });
		} else {
			await this.insert({ state });
		}
		return true;
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

	db() {
		return this.#database;
	}
}

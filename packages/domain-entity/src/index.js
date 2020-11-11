export default class BaseEntity {
	#id = null;

	#state = {};

	#database = null;

	#entityEvents = {};

	#collectionName;

	#created = false;

	constructor({ collectionName, database, entityEvents, Repository, softDelete }) {
		if (!database) throw new Error('Database undefined');
		if (!collectionName) throw new Error('Entity type undefined');
		if (typeof softDelete !== 'boolean') throw new Error('Entity type undefined');
		this.#collectionName = collectionName;
		this.#database = database;
		this.#entityEvents = entityEvents;
		this.repository = new Repository({ collectionName, database, softDelete });
	}

	setId({ id }) {
		if (!id) throw new Error('Entity id undefined');
		this.#id = id;
		return true;
	}

	async hydrate() {
		if (!this.#id) throw new Error('Entity id undefined');
		const state = await this.#database.findById({
			collectionName: this.#collectionName,
			id: this.#id,
		});
		if (state) {
			this.#created = true;
			this.#state = state;
		}
		return true;
	}

	async apply({ events, save = false }) {
		for (let index = 0; index < events.length; index += 1) {
			const event = events[`${index}`];
			const eventType = `${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
			const Event = this.#entityEvents[`${eventType}`];
			if (typeof Event === 'function') {
				const constructedEvent = new Event({
					aggregate: event.aggregate,
				});
				// eslint-disable-next-line no-await-in-loop
				await constructedEvent.init({
					timestamp: event.timestamp,
					meta: event.meta,
					payload: event.payload,
				});
				this.#state = constructedEvent.apply({ state: this.#state });
			}
		}
		if (save) await this.save();
		return true;
	}

	async save() {
		if (!this.#id) throw new Error('Entity id undefined');
		this.#state.id = this.#id;
		if (this.#created && this.#state.active === false) {
			await this.repository.delete({ state: this.#state });
		} else if (this.#created && this.#state.active === true) {
			await this.repository.update({ state: this.#state });
		} else if (this.#created === false && this.#state.active) {
			await this.repository.update({ state: this.#state });
		}
		return true;
	}

	getState() {
		return { ...this.#state };
	}

	getId() {
		if (!this.#id) throw new Error('Entity id undefined');
		return this.#id;
	}
}

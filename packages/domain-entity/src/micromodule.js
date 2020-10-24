export default class BaseEntity {
	#id = null;

	#state = {};

	#database = null;

	#entityEvents = {};

	#type;

	#created = false;

	constructor({ type, database, entityEvents, Repository }) {
		if (!database) throw new Error('Database undefined');
		if (!type) throw new Error('Entity type undefined');
		this.#type = type;
		this.#database = database;
		this.#entityEvents = entityEvents;
		this.repository = new Repository({ collectionName: type, database });
	}

	setId({ id }) {
		if (!id) throw new Error('Entity id undefined');
		this.#id = id;
		return true;
	}

	async hydrate() {
		if (!this.#id) throw new Error('Entity id undefined');
		const state = await this.#database.findById({
			collectionName: this.#type,
			id: this.#id,
		});
		if (state) {
			this.#created = true;
			this.#state = state;
		}
		return true;
	}

	async apply({ events, save = false }) {
		events.forEach((event) => {
			const eventType = `${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
			if (typeof this.#entityEvents[`${eventType}`] !== 'function')
				throw new Error(`Entity event with type : ${eventType} undefined`);
			const Event = this.#entityEvents[`${eventType}`];
			const constructedEvent = new Event(event);
			this.#state = constructedEvent.apply({ state: this.#state });
		});
		if (save) await this.save();
		return true;
	}

	async save() {
		if (!this.#id) throw new Error('Entity id undefined');
		if (this.#created === true && this.#state) {
			await this.repository.update({ state: this.#state });
		} else if (this.#created === false && this.#state) {
			await this.repository.insert({ state: this.#state });
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

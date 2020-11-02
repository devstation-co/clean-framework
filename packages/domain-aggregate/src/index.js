export default class BaseAggregate {
	#id = null;

	#state = {};

	#entities = {};

	#events = {};

	#eventStore;

	constructor({ id, eventStore, aggregateEntities, aggregateEvents }) {
		if (!id) throw new Error('Aggregate id undefined');
		if (!eventStore) throw new Error('Event store undefined');
		this.#id = id;
		this.#eventStore = eventStore;
		this.init({ entities: aggregateEntities, events: aggregateEvents });
	}

	init({ entities, events }) {
		this.#events = { ...events };
		Object.keys(entities).forEach((entity) => {
			const entityName = `${entity.charAt(0).toLowerCase()}${entity.slice(1)}`;
			this.#entities[`${entityName}`] = new entities[`${entity}`]({ aggregateId: this.#id });
			this.#events = { ...this.#events, ...this.#entities[`${entityName}`].getEvents() };
		});
	}

	async hydrate() {
		const events = await this.#eventStore.getEventsByAggregateId({
			aggregateId: this.#id,
		});
		events.forEach((event) => {
			const eventType = `${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
			if (typeof this.#events[`${eventType}`] !== 'function')
				throw new Error(`Aggregate event with type : ${eventType} undefined`);
			const Event = this.#events[`${eventType}`];
			const constructedEvent = new Event(event);
			this.#state = constructedEvent.apply({ state: this.#state });
		});
		return true;
	}

	async commit({ event }) {
		this.#state = event.apply({
			state: this.getState(),
		});
		const eventDetails = event.getDetails();
		await this.#eventStore.commit({ event: eventDetails });
		return eventDetails;
	}

	getAggregateId() {
		return this.#id;
	}

	getState() {
		return { ...this.#state };
	}

	getEntities() {
		return this.#entities;
	}

	getEvents() {
		return this.#events;
	}
}

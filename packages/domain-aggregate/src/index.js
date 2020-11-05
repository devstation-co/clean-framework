import Validator from '@devstation.co/validator.infrastructure.micromodule';

export default class BaseAggregate {
	#aggregateType;

	#aggregateId;

	#state;

	#validator;

	#events;

	#entities;

	#eventStore;

	constructor({ id, type, events, entities, eventStore }) {
		this.init({ id, type, events, entities });
		if (!eventStore) throw new Error('Event-store undefined');
		this.#eventStore = eventStore;
		this.#validator = new Validator();
	}

	init({ id, type, events, entities }) {
		if (!id) throw new Error('Aggregate id undefined');
		if (!type) throw new Error('Aggregate type undefined');
		this.#aggregateId = id;
		this.#aggregateType = type;
		this.#state = {
			id,
		};
		this.#events = events;
		this.#entities = entities;

		entities.forEach((Entity) => {
			const entity = new Entity({
				aggregate: {
					id,
					type,
				},
			});
			const entityType = entity.getEntityType();
			this.#events = { ...this.#events, ...entity.getEvents() };
			this.#entities[`${entityType}`] = entity;
		});
	}

	async validate({ params, schema }) {
		const res = await this.#validator.validate({ data: params, schema });
		return res;
	}

	getAggregateId() {
		return this.#aggregateId;
	}

	getAggregateType() {
		return this.#aggregateType;
	}

	getState() {
		return this.#state;
	}

	async generateEvent({ type, meta, payload }) {
		const eventType = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
		const Event = this.#events[`${eventType}`];
		if (typeof this.#events[`${eventType}`] !== 'function')
			throw new Error(`Event ${type} undefined`);
		const event = new Event({
			aggregate: {
				id: this.getAggregateId(),
				type: this.getAggregateType(),
			},
		});
		await event.init({ meta, payload });
		return event;
	}

	async hydrate() {
		const events = await this.#eventStore.getEventsByAggregateId({
			aggregateId: this.#aggregateId,
		});
		for (let index = 0; index < events.length; index += 1) {
			const event = events[`${index}`];
			const eventType = `${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
			if (typeof this.#events[`${eventType}`] === 'function') {
				const Event = this.#events[`${eventType}`];
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
		return true;
	}

	async commit({ event }) {
		this.apply({ event });
		const eventDetails = event.getDetails();
		await this.#eventStore.commit({ event: eventDetails });
		return true;
	}

	apply({ event }) {
		this.#state = event.apply({ state: this.#state });
	}

	getEntity({ type }) {
		const entity = this.#entities[`${type}`];
		if (!entity) throw new Error(`Entity ${type} undefined`);
		return entity;
	}
}

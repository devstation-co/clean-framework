import Validator from '@devstation.co/validator.infrastructure.micromodule';

export default class BaseAggregateEntity {
	#entityType;

	#aggregateType;

	#aggregateId;

	#validator;

	#events;

	constructor({ type, aggregate, events }) {
		this.init({ aggregate, type, events });
		this.#validator = new Validator();
	}

	init({ aggregate, type, events }) {
		if (!type) throw new Error('Entity type undefined');
		if (!aggregate) throw new Error('Entity aggregate undefined');
		if (!aggregate.id) throw new Error('Entity aggregate id undefined');
		if (!aggregate.type) throw new Error('Entity aggregate type undefined');
		this.#entityType = type;
		this.#aggregateId = aggregate.id;
		this.#aggregateType = aggregate.type;
		this.#events = events;
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

	getEntityType() {
		return this.#entityType;
	}

	getEvents() {
		return this.#events;
	}

	async generateEvent({ type, meta, payload }) {
		const eventType = `${type.charAt(0).toUpperCase()}${type.slice(1)}`;
		const Event = this.#events[`${eventType}`];
		const event = new Event({
			aggregate: {
				id: this.getAggregateId(),
				type: this.getAggregateType(),
			},
		});
		await event.init({ meta, payload });
		return event;
	}
}

export default class BaseEvent {
	#id;

	#type;

	#timestamp;

	#meta;

	#aggregate;

	#payload;

	constructor({ id, type, timestamp, meta, aggregate, aggregateId, aggregateType, payload }) {
		if (!type) throw new Error('Event type undefined');
		if (aggregate) {
			if (!aggregate.type) throw new Error('Aggregate type undefined');
			if (!aggregate.id) throw new Error('Aggregate type undefined');
			this.#aggregate = {
				id: aggregate.id,
				type: aggregate.type,
			};
		} else {
			if (!aggregateType) throw new Error('Aggregate type undefined');
			if (!aggregateId) throw new Error('Aggregate id undefined');
			this.#aggregate = {
				id: aggregateId,
				type: aggregateType,
			};
		}
		this.#id = id;
		this.#type = type;
		this.#timestamp = timestamp || new Date();
		this.#meta = meta || {};

		this.#payload = payload || {};
	}

	getDetails() {
		const event = {
			id: this.#id,
			type: this.#type,
			timestamp: this.#timestamp,
			aggregate: { ...this.#aggregate },
			meta: { ...this.#meta },
			payload: { ...this.#payload },
		};
		return event;
	}
}

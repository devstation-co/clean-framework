import Validator from '@devstation.co/validator.infrastructure.micromodule';

export default class Base {
	#validator;

	#type;

	#aggregateId;

	#aggregateType;

	#payload = {};

	#meta = {};

	#timestamp;

	#metaSchema;

	#payloadSchema;

	constructor({ type, aggregate, payload, meta }) {
		this.#validator = new Validator();
		if (!type) throw new Error('Event type undefined');
		if (!aggregate?.id) throw new Error('Aggregate id undefined');
		if (!aggregate?.type) throw new Error('Aggregate type undefined');
		if (!payload) throw new Error('Payload schema undefined');
		if (!meta) throw new Error('Meta schema undefined');
		this.#type = type;
		this.#aggregateId = aggregate.id;
		this.#aggregateType = aggregate.type;
		this.#metaSchema = meta;
		this.#payloadSchema = payload;
	}

	getDetails() {
		const details = {
			type: this.#type,
			timestamp: this.#timestamp,
			aggregate: {
				id: this.#aggregateId,
				type: this.#aggregateType,
			},
			meta: { ...this.#meta },
			payload: { ...this.#payload },
		};
		return Object.freeze(details);
	}

	async init({ timestamp, meta = {}, payload = {} }) {
		if (!meta) throw new Error('Event meta undefined');
		if (!payload) throw new Error('Event payload undefined');
		this.#timestamp = timestamp || new Date();
		await this.#validator.validate({
			data: meta,
			schema: this.#metaSchema,
		});
		await this.#validator.validate({
			data: payload,
			schema: this.#payloadSchema,
		});
		this.#payload = { ...payload };
		this.#meta = { ...meta };
	}
}

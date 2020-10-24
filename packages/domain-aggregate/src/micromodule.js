export default class BaseAggregate {
	#id = null;

	#state = {};

	#eventStore = null;

	#aggregateEvents = {};

	constructor({ id, eventStore, aggregateEvents }) {
		if (!id) throw new Error('Aggregate id undefined');
		if (!eventStore) throw new Error('Event store undefined');
		this.#eventStore = eventStore;
		this.#id = id;
		this.#aggregateEvents = aggregateEvents;
	}

	async hydrate() {
		const events = await this.#eventStore.getAggregateEvents({
			aggregateId: this.#id,
		});
		events.forEach((event) => {
			const eventType = `${event.type.charAt(0).toUpperCase()}${event.type.slice(1)}`;
			if (typeof this.#aggregateEvents[`${eventType}`] !== 'function')
				throw new Error(`Aggregate event with type : ${eventType} undefined`);
			const Event = this.#aggregateEvents[`${eventType}`];
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

	getState() {
		return { ...this.#state };
	}

	getId() {
		if (!this.#id) throw new Error('Aggregate id undefined');
		return this.#id;
	}
}

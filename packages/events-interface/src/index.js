export default class EventsInterface {
	#eventBus;

	constructor({ namespace, events, controllers, application, infrastructure }) {
		this.namespace = namespace;
		this.#eventBus = infrastructure.eventBus;
		this.events = [];
		events.forEach((event) => {
			let controller;
			if (typeof controllers[event.controller] === 'function') {
				controller = controllers[event.controller];
			} else if (!event.controller && typeof controllers[event.type] === 'function') {
				controller = controllers[event.type];
			} else {
				throw new Error(`Event ${event.type} controller undefined`);
			}
			const handler = controller({ application, infrastructure });
			this.events.push({
				type: event.type,
				params: event.params,
				handler: async (params) => {
					try {
						await handler({ event: params.event });
						return {
							status: 'eventExecuted',
							timestamp: Date.now(),
						};
					} catch (error) {
						return {
							status: 'eventRefused',
							timestamp: Date.now(),
							reasons: [error],
						};
					}
				},
			});
		});
	}

	async run() {
		await this.#eventBus.subscribeToEvents({
			namespace: this.namespace,
			events: this.events,
		});
		const successEvent = {
			name: 'eventsApiInitialized',
			createdAt: new Date(),
			payload: {},
		};
		return successEvent;
	}
}

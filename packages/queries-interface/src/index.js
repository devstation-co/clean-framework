export default class QueriesApiInterfaceMicromodule {
	#commandBus;

	constructor(params) {
		const { namespace, queries, controllers, application, infrastructure } = params;
		this.namespace = namespace;
		this.#commandBus = infrastructure.commandBus;
		this.queries = [];
		queries.forEach((query) => {
			let controller;
			if (typeof controllers[query.controller] === 'function') {
				controller = controllers[query.controller];
			} else if (!query.controller && typeof controllers[query.type] === 'function') {
				controller = controllers[query.type];
			} else {
				throw new Error(`Query ${query.type} controller undefined`);
			}
			const handler = controller({ application, infrastructure });
			this.queries.push({
				type: query.type,
				params: query.params,
				handler: async (receivedQuery) => {
					try {
						const handlerResponse = await handler(receivedQuery);
						if (
							handlerResponse instanceof Error ||
							(handlerResponse?.stack && handlerResponse?.message)
						) {
							const error = {
								status: 'error',
								timestamp: new Date(),
								payload: {
									source: 'queries-interface',
									query: query.type,
									reasons:
										handlerResponse.name === 'VALIDATION_ERROR'
											? JSON.parse(handlerResponse.message)
											: [handlerResponse.message],
								},
							};
							return error;
						}
						const response = {
							status: 'success',
							timestamp: new Date(),
							payload: handlerResponse,
						};
						return response;
					} catch (error) {
						return {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'queries-interface',
								query: query.type,
								reasons: [error.message],
							},
						};
					}
				},
			});
		});
	}

	async run() {
		await this.#commandBus.subscribeToCommands({
			namespace: this.namespace,
			commands: this.queries,
		});
		const successEvent = {
			status: 'success',
			createdAt: new Date(),
			payload: {},
		};
		return successEvent;
	}
}

export default class QueriesApiInterfaceMicromodule {
	constructor(params) {
		const { namespace, queries, controllers, application, infrastructure } = params;
		this.namespace = namespace;
		this.commandBus = infrastructure.commandBus;
		this.queries = [];
		queries.forEach((query) => {
			let controller;
			if (typeof controllers[query.controller] === 'function') {
				controller = controllers[query.controller];
			} else if (!query.controller && typeof controllers[query.name] === 'function') {
				controller = controllers[query.name];
			} else {
				throw new Error(`Query ${query.name} controller undefined`);
			}
			const handler = controller({ application, infrastructure });
			this.queries.push({
				name: query.name,
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
									source: 'queries-api',
									query: query.name,
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
								source: 'queries-api',
								query: query.name,
								reasons: [error.message],
							},
						};
					}
				},
			});
		});
	}

	async run() {
		await this.commandBus.subscribeToCommands({
			namespace: this.namespace,
			commands: this.queries,
		});
		const successEvent = {
			name: 'queriesApiInitialized',
			createdAt: new Date(),
			payload: {},
		};
		return successEvent;
	}
}

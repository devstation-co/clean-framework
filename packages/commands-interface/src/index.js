export default class CommandsApiInterfaceMicromodule {
	#commandBus;

	constructor(params) {
		const { namespace, commands, controllers, application, infrastructure } = params;
		this.namespace = namespace;
		this.#commandBus = infrastructure.commandBus;
		this.commands = [];
		commands.forEach((command) => {
			let controller;
			if (typeof controllers[command.controller] === 'function') {
				controller = controllers[command.controller];
			} else if (!command.controller && typeof controllers[command.name] === 'function') {
				controller = controllers[command.name];
			} else {
				throw new Error(`Command ${command.name} controller undefined`);
			}
			const handler = controller({ application, infrastructure });
			this.commands.push({
				type: command.type,
				params: command.params,
				handler: async (cmd) => {
					try {
						const handlerResponse = await handler(cmd);
						if (
							handlerResponse instanceof Error ||
							(handlerResponse?.stack && handlerResponse?.message)
						) {
							const error = {
								status: 'error',
								timestamp: new Date(),
								payload: {
									source: 'commands-api',
									command: cmd.name,
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
						};
						return response;
					} catch (error) {
						return {
							status: 'error',
							timestamp: new Date(),
							payload: {
								source: 'commands-api',
								command: command.name,
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
			commands: this.commands,
		});
		const successEvent = {
			status: 'success',
			createdAt: new Date(),
			payload: {},
		};
		return successEvent;
	}
}

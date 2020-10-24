export default class CliInterfaceMicromodule {
	constructor({ commands, controllers, application, infrastructure }) {
		this.cli = infrastructure.cli;
		this.commands = [];
		commands.forEach((command) => {
			const { name, description, controller, args } = command;
			if (typeof controllers[`${controller}`] !== 'function')
				throw new Error(`${controller} controller is not a function`);
			const initializedController = controllers[`${controller}`]({ application, infrastructure });
			const newCommand = {
				name,
				description,
				args,
				controller: initializedController,
			};
			this.commands.push(newCommand);
		});
	}

	async run() {
		await this.cli.registerCommands(this.commands);
		await this.cli.run();
		const successEvent = {
			name: 'commandsApiInitialized',
			createdAt: new Date(),
			payload: {
				version: this.version,
			},
		};
		return successEvent;
	}
}

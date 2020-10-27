export default class CliInterface {
	constructor({ commands, controllers, application, infrastructure }) {
		this.cli = infrastructure.cli;
		this.commands = [];
		commands.forEach((command) => {
			const { name, description, controller, options } = command;
			if (typeof controllers[`${controller}`] !== 'function')
				throw new Error(`${controller} controller is not a function`);
			const initializedController = controllers[`${controller}`]({ application, infrastructure });
			const newCommand = {
				name,
				description,
				options,
				controller: initializedController,
			};
			this.commands.push(newCommand);
		});
	}

	async run() {
		await this.cli.registerCommands(this.commands);
		await this.cli.run();
		const response = {
			status: 'success',
			timestamp: new Date(),
			payload: {
				version: this.version,
			},
		};
		return response;
	}
}

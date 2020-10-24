export default class ApplicationBase {
	#domain;

	#infrastructure;

	constructor({ applications, domain, infrastructure }) {
		this.applications = [];
		this.#domain = domain;
		this.#infrastructure = infrastructure;
		applications.forEach((applicationSettings) => {
			const Application = applicationSettings.application;
			this[applicationSettings.name] = new Application({
				domain,
				infrastructure,
			});
			this.applications.push(applicationSettings.name);
		});
	}

	use({ plugin }) {
		if (this.applications.indexOf(plugin.name) !== -1)
			throw new Error('Duplicate name detected while registring application plugin');
		const Application = plugin.application;
		this[plugin.name] = new Application({
			domain: this.#domain,
			infrastructure: this.#infrastructure,
		});
		this.applications.push(plugin.name);
	}
}

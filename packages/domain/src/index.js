export default class DomainBase {
	constructor({ domains }) {
		this.domains = [];
		domains.forEach((domainSettings) => {
			this[domainSettings.name] = {
				aggregates: domainSettings.domain.aggregates,
				entities: domainSettings.domain.entities,
			};
			this.domains.push(domainSettings.name);
		});
	}

	use({ plugin }) {
		if (this.domains.indexOf(plugin.name) !== -1)
			throw new Error('Duplicate name detected while registring domain plugin');
		this[plugin.name] = {
			aggregates: plugin.domain.aggregates,
			entities: plugin.domain.entities,
		};
		this.domains.push(plugin.name);
	}
}

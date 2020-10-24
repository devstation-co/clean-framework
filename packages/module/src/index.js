export default class ModuleBase {
	#Domain;

	#Infrastructure;

	#Application;

	#Interface;

	#View;

	#infrastructureSettings;

	#plugins;

	constructor({ settings, layers }) {
		const { infrastructure, plugins } = settings;
		const { Domain, Infrastructure, Application, Interface, View } = layers;
		this.#Domain = Domain;
		this.#Infrastructure = Infrastructure;
		this.#Application = Application;
		this.#Interface = Interface;
		this.#View = View;
		this.infrastructureSettings = infrastructure;
		this.#plugins = plugins;
	}

	async init() {
		if (this.#Domain) this.#initDomain();
		if (this.#Infrastructure) await this.#initInfrastructure();
		if (this.#Application) this.#initApplication();
		if (this.#View) this.#initView();
		if (this.#Interface) this.#initInterface();
	}

	#initInfrastructure = async () => {
		const Infrastructure = this.#Infrastructure;
		this.infrastructure = new Infrastructure(this.infrastructureSettings);
		await this.infrastructure.init();
		return true;
	};

	#initDomain = async () => {
		this.domain = new this.#Domain();
		if (this.#plugins) {
			const plugins = [];
			this.#plugins.forEach((plugin) => {
				if (plugin.domain) plugins.push(this.domain.use({ plugin }));
			});
			await Promise.all(plugins);
		}
		return true;
	};

	#initApplication = async () => {
		const Application = this.#Application;
		this.application = new Application({
			infrastructure: this.infrastructure,
			domain: this.domain,
		});
		if (this.#plugins) {
			const plugins = [];
			this.#plugins.forEach((plugin) => {
				if (plugin.application) plugins.push(this.application.use({ plugin }));
			});
			await Promise.all(plugins);
		}
	};

	#initView = async () => {
		const View = this.#View;
		this.view = new View();
		if (this.#plugins) {
			const plugins = [];
			this.#plugins.forEach((plugin) => {
				if (plugin.view) plugins.push(this.view.use({ plugin }));
			});
			await Promise.all(plugins);
		}
		return true;
	};

	#initInterface = async () => {
		const Interface = this.#Interface;
		this.interface = new Interface({
			infrastructure: this.infrastructure,
			application: this.application,
			view: this.view,
		});
		this.interface.interfaces.forEach((interfaceName) => {
			if (typeof this.interface[`${interfaceName}`].init === 'function')
				this.interface[`${interfaceName}`].init();
		});
	};
}

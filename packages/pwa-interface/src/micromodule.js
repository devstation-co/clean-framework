export default class PwaInterface {
	#view;

	#application;

	#infrastructure;

	constructor({ infrastructure, application, view }) {
		this.#view = view;
		this.#application = application;
		this.#infrastructure = infrastructure;
	}

	init() {
		this.app = this.#infrastructure.pwa;
		this.app.registerInstanceProperty({
			name: 'infrastructure',
			value: this.#infrastructure,
		});
		this.app.registerInstanceProperty({
			name: 'application',
			value: this.#application,
		});
		this.#infrastructure.micromodules.forEach((micromodule) => {
			if (typeof this.#infrastructure[`${micromodule}`].getPluginsToInstall === 'function') {
				const plugins = this.#infrastructure[`${micromodule}`].getPluginsToInstall();
				plugins.forEach((p) => {
					this.app.usePlugin({ plugin: p.plugin, settings: p.settings });
				});
			}
		});
	}

	run() {
		this.app.initApp({
			app: this.#view.main.miniapp,
			router: this.#infrastructure.router.getRouter(),
			materialUi: this.#infrastructure.materialUi.getInstance(),
		});
		this.#view.views.forEach((view) => {
			this.#infrastructure.router.registerRoutes({ routes: this.#view[`${view}`].routes });
		});
		this.app.mountApp();
	}
}

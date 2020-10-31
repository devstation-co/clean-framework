export default class HttpInterface {
	#webServer;

	constructor(params) {
		const { infrastructure, middlewares, application, routes, controllers } = params;
		const dependencies = {
			infrastructure,
			application,
		};
		this.#webServer = infrastructure.webServer;
		this.routes = routes;
		const initializedControllers = {};
		Object.keys(controllers).forEach((controller) => {
			initializedControllers[`${controller}`] = controllers[`${controller}`](dependencies);
		});
		const initializedMiddlewares = {};
		Object.keys(middlewares).forEach((middleware) => {
			initializedMiddlewares[`${middleware}`] = middlewares[`${middleware}`](dependencies);
		});
		this.#webServer.register({
			routes: this.routes,
			controllers: initializedControllers,
			middlewares: initializedMiddlewares,
		});
	}

	async run() {
		await this.#webServer.run();
		const res = {
			status: 'success',
			createdAt: new Date(),
			payload: {
				routes: this.routes,
			},
		};
		return res;
	}
}

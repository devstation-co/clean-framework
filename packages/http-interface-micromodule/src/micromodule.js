export default class HttpApiInterfaceMicromodule {
	constructor(params) {
		const { infrastructure, application, responses, routes, controllers } = params;
		const constrollersDependencies = {
			infrastructure,
			responses,
			application,
		};
		this.webServer = infrastructure.webServer;
		this.routes = [];
		Object.keys(routes).forEach((route) => {
			this.routes.push(routes[`${route}`]);
		});
		this.controllers = {};
		Object.keys(controllers).forEach((controller) => {
			this.controllers[`${controller}`] = controllers[`${controller}`](constrollersDependencies);
		});
		this.webServer.register({
			routes: this.routes,
			controllers: this.controllers,
		});
	}

	async run() {
		await this.webServer.run();
		const successEvent = {
			name: 'httpApiInitialized',
			createdAt: new Date(),
			payload: {
				routes: this.routes,
			},
		};
		return successEvent;
	}
}

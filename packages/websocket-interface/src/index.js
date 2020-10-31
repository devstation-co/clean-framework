export default class WebsocketInterface {
	#middlewares;

	#requests;

	#websocketServer;

	constructor({ plugins, requests, controllers, middlewares, infrastructure, application }) {
		this.#websocketServer = infrastructure.websocketServer;
		this.#middlewares = {
			requestMiddlewares: {},
			ioMiddlewares: [],
		};
		this.#requests = [];

		if (middlewares) {
			if (middlewares.requestMiddlewares) {
				Object.keys(middlewares.requestMiddlewares).forEach((middleware) => {
					const newMiddleware = middlewares.requestMiddlewares[`${middleware}`]({
						infrastructure,
						application,
					});
					this.#middlewares.requestMiddlewares[`${middleware}`] = newMiddleware;
				});
			}

			if (middlewares.ioMiddlewares) {
				middlewares.ioMiddlewares.forEach((middleware) => {
					const newMiddleware = middleware({ infrastructure, application });
					this.#middlewares.ioMiddlewares.push(newMiddleware);
				});
			}
		}
		if (plugins) {
			plugins.forEach((Plugin) => {
				const plugin = new Plugin();
				const pluginName = plugin.name;
				plugin.requests.forEach((request) => {
					let controller;
					if (typeof plugin.controllers[request.controller] === 'function') {
						controller = plugin.controllers[request.controller];
					} else if (
						!request.controller &&
						typeof plugin.controllers[request.name] === 'function'
					) {
						controller = plugin.controllers[request.name];
					} else {
						throw new Error(`Request ${request.name} controller undefined`);
					}
					const newRequest = {
						name: `${pluginName}.${request.name}`,
						middlewares: request.middlewares,
						controller: controller({
							infrastructure,
							application,
						}),
					};
					this.#requests.push(newRequest);
				});
				if (plugin.middlewares) {
					if (plugin.middlewares.requestMiddlewares) {
						Object.keys(plugin.middlewares.requestMiddlewares).forEach((middleware) => {
							const newMiddleware = plugin.middlewares.requestMiddlewares[`${middleware}`]({
								infrastructure,
								application,
							});
							this.#middlewares.requestMiddlewares[`${pluginName}.${middleware}`] = newMiddleware;
						});
					}
					if (plugin.middlewares.ioMiddlewares) {
						plugin.middlewares.ioMiddlewares.forEach((middleware) => {
							const newMiddleware = middleware({ infrastructure, application });
							if (this.#middlewares.ioMiddlewares.indexOf(newMiddleware) !== -1)
								throw new Error(`Duplicate io middleware detected in ${pluginName}`);
							this.#middlewares.ioMiddlewares.push(newMiddleware);
						});
					}
				}
			});
		}

		if (requests) {
			requests.forEach((request) => {
				let controller;
				if (typeof controllers[request.controller] === 'function') {
					controller = controllers[request.controller];
				} else if (!request.controller && typeof controllers[request.name] === 'function') {
					controller = controllers[request.name];
				} else {
					throw new Error(`Request ${requests.name} controller undefined`);
				}
				const newRequest = {
					name: request.name,
					middlewares: request.middlewares,
					controller: controller({
						infrastructure,
						application,
					}),
				};
				this.#requests.push(newRequest);
			});
		}
	}

	async run() {
		this.#websocketServer.subscribeToRequests({
			requests: this.#requests,
			middlewares: this.#middlewares.requestMiddlewares,
		});
		this.#websocketServer.subscribeMiddlewares({
			middlewares: this.#middlewares.ioMiddlewares,
		});
		const successrequest = await this.#websocketServer.run();
		return successrequest;
	}
}

export default class WebsocketApiInterfaceMicromodule {
	#middlewares;

	#requests;

	#websocketServer;

	constructor({ micromodules, requests, controllers, middlewares, infrastructure, application }) {
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
		if (micromodules) {
			micromodules.forEach((Micromodule) => {
				const micromodule = new Micromodule();
				const micromoduleName = micromodule.name;
				micromodule.requests.forEach((request) => {
					let controller;
					if (typeof micromodule.controllers[request.controller] === 'function') {
						controller = micromodule.controllers[request.controller];
					} else if (
						!request.controller &&
						typeof micromodule.controllers[request.name] === 'function'
					) {
						controller = micromodule.controllers[request.name];
					} else {
						throw new Error(`Request ${request.name} controller undefined`);
					}
					const newRequest = {
						name: `${micromoduleName}.${request.name}`,
						middlewares: request.middlewares,
						controller: controller({
							infrastructure,
							application,
						}),
					};
					this.#requests.push(newRequest);
				});
				if (micromodule.middlewares) {
					if (micromodule.middlewares.requestMiddlewares) {
						Object.keys(micromodule.middlewares.requestMiddlewares).forEach((middleware) => {
							const newMiddleware = micromodule.middlewares.requestMiddlewares[`${middleware}`]({
								infrastructure,
								application,
							});
							this.#middlewares.requestMiddlewares[
								`${micromoduleName}.${middleware}`
							] = newMiddleware;
						});
					}
					if (micromodule.middlewares.ioMiddlewares) {
						micromodule.middlewares.ioMiddlewares.forEach((middleware) => {
							const newMiddleware = middleware({ infrastructure, application });
							if (this.#middlewares.ioMiddlewares.indexOf(newMiddleware) !== -1)
								throw new Error(`Duplicate io middleware detected in ${micromoduleName}`);
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

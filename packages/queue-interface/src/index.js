export default class QueueInterface {
	#on = true;

	#heartbeat = 1000;

	#interval;

	#queuer;

	#queueName;

	#tasks = {};

	constructor({ queueName, application, infrastructure, tasks, controllers }) {
		if (!infrastructure.queuer) throw new Error('QueuerUndefined');
		if (!queueName) throw new Error('QueueNameUndefined');
		this.#queuer = infrastructure.queuer;
		this.#queueName = queueName;
		tasks.forEach((task) => {
			let controller;
			if (task.controller && typeof controllers[`${task.controller}`] === 'function') {
				controller = controllers[`${task.controller}`];
			} else if (!task.controller && typeof controllers[`${task.type}`] === 'function') {
				controller = controllers[`${task.type}`];
			} else {
				throw new Error(`${task.type}ControllerUndefined`);
			}
			this.#tasks[`${task.type}`] = {
				type: task.type,
				params: task.params,
				controller: controller({ infrastructure, application }),
			};
		});
	}

	async run() {
		this.#queuer.createWorker({ name: this.#queueName, tasks: this.#tasks });
	}
}

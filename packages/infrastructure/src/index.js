export default class InfrastructureBase {
	constructor({ micromodules }) {
		this.micromodules = [];
		this.micromodulesSettings = {};
		this.waitingList = [];
		this.initializeMicromodules({ micromodules });
		this.initializeWaitingList();
	}

	initializeMicromodules({ micromodules }) {
		micromodules.forEach((infrastructureMicromodule) => {
			if (!infrastructureMicromodule.name)
				throw new Error('Infrastructure micromodule name undefined');
			if (!infrastructureMicromodule.micromodule)
				throw new Error(`${infrastructureMicromodule.name} micromodule undefined`);
			const Micromodule = infrastructureMicromodule.micromodule;
			let micromoduleSettings = infrastructureMicromodule.settings;
			if (!micromoduleSettings) micromoduleSettings = {};
			if (
				micromoduleSettings &&
				micromoduleSettings.dependencies &&
				micromoduleSettings.dependencies.length > 0
			) {
				const intersection = this.micromodules.filter((value) =>
					micromoduleSettings.dependencies.includes(value),
				);
				if (intersection.length === micromoduleSettings.dependencies.length) {
					const dependencies = {};
					micromoduleSettings.dependencies.forEach((dependency) => {
						dependencies[`${dependency}`] = this[`${dependency}`];
					});
					micromoduleSettings.dependencies = dependencies;

					this[`${infrastructureMicromodule.name}`] = new Micromodule(micromoduleSettings);
					this.micromodules.push(infrastructureMicromodule.name);
					this.micromodulesSettings[infrastructureMicromodule.name] = micromoduleSettings;
					this.waitingList = this.waitingList.filter(
						(micromodule) => micromodule.name !== infrastructureMicromodule.name,
					);
				} else {
					micromoduleSettings.dependencies.forEach((dependency) => {
						if (this.micromodules.indexOf(dependency) === -1) {
							if (this.waitingList.indexOf(infrastructureMicromodule) === -1)
								this.waitingList.push(infrastructureMicromodule);
						}
					});
				}
			} else {
				this[infrastructureMicromodule.name] = new Micromodule(micromoduleSettings);
				this.micromodules.push(infrastructureMicromodule.name);
				this.micromodulesSettings[infrastructureMicromodule.name] = micromoduleSettings;
			}
		});
	}

	initializeWaitingList() {
		while (this.waitingList.length > 0) {
			this.initializeMicromodules({ micromodules: this.waitingList });
		}
	}

	async init() {
		const micromodulesToInit = [];
		this.micromodules.forEach((micromodule) => {
			if (
				this.micromodulesSettings[`${micromodule}`].init &&
				typeof this[`${micromodule}`].init === 'function'
			) {
				micromodulesToInit.push(
					this[`${micromodule}`].init(this.micromodulesSettings[`${micromodule}`].init),
				);
			}
		});
		await Promise.all(micromodulesToInit);
		return true;
	}
}

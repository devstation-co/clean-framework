export default class InterfaceBase {
	constructor({ interfaces }) {
		this.interfaces = [];
		interfaces.forEach((interfaceSettings) => {
			const Interface = interfaceSettings.interface;
			this.interfaces.push(interfaceSettings.name);
			this[interfaceSettings.name] = new Interface(interfaceSettings.settings);
		});
	}

	async run({ interfaces }) {
		if (!interfaces) throw new Error('Interfaces undefined');
		const promises = [];
		interfaces.forEach((interfaceName) => {
			promises.push(this[`${interfaceName}`].run());
		});
		const responses = await Promise.all(promises);
		const successEvent = {
			name: 'interfacesRunning',
			createdAt: new Date(),
			payload: {
				responses,
			},
		};
		return successEvent;
	}
}

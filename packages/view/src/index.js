export default class BaseView {
	constructor({ views }) {
		this.views = [];
		views.forEach((viewSettings) => {
			const View = viewSettings.view;
			this[viewSettings.name] = new View();
			this.views.push(viewSettings.name);
		});
	}

	use({ plugin }) {
		if (this.views.indexOf(plugin.name) !== -1)
			throw new Error('Duplicate name detected while registring view plugin');
		const View = plugin.view;
		this[plugin.name] = new View();
		this.views.push(plugin.name);
	}
}

export default class BaseApplication {
	constructor({ useCases, settings }) {
		Object.keys(useCases).forEach((useCaseName) => {
			this[`${useCaseName}`] = useCases[`${useCaseName}`](settings);
		});
	}
}

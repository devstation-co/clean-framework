export default class ViewBaseMicromodule {
	constructor({ miniapp, pages, components, screens }) {
		this.miniapp = miniapp;
		this.components = components;
		this.screens = screens;
		this.routes = pages;
	}
}

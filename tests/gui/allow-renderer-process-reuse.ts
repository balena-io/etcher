// tslint:disable-next-line:no-var-requires
const { app } = require('electron');
if (app !== undefined) {
	app.allowRendererProcessReuse = false;
}

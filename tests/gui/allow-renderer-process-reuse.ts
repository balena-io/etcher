// tslint:disable-next-line:no-var-requires
const { app } = require('electron');

if (app !== undefined) {
	// tslint:disable-next-line:no-var-requires
	require('@electron/remote/main').initialize();

	app.allowRendererProcessReuse = false;
}

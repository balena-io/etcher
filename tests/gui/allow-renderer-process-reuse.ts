// tslint:disable-next-line:no-var-requires
const { app } = require('electron');

if (app !== undefined) {
	// tslint:disable-next-line:no-var-requires
	const remoteMain = require('@electron/remote/main');

	remoteMain.initialize();

	app.on('browser-window-created', (_event, window) =>
		remoteMain.enable(window.webContents),
	);
}

const { app } = require('electron');

if (app !== undefined) {
	const remoteMain = require('@electron/remote/main');

	remoteMain.initialize();

	app.on(
		'browser-window-created',
		(_event: Electron.Event, window: Electron.BrowserWindow) =>
			remoteMain.enable(window.webContents),
	);
}

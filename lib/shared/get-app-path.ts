export function getAppPath(): string {
	return (
		(require('electron').app || require('@electron/remote').app)
			.getAppPath()
			// With macOS universal builds, getAppPath() returns the path to an app.asar file containing an index.js file which will
			// include the app-x64 or app-arm64 folder depending on the arch.
			// We don't care about the app.asar file, we want the actual folder.
			.replace(/\.asar$/, () =>
				process.platform === 'darwin' ? '-' + process.arch : '',
			)
	);
}

//
// Anything exported from this module will become available to the
// renderer process via preload. They're accessible as `window.etcher.foo()`.
//

import { ipcRenderer } from 'electron';

// FIXME: this is a workaround for the renderer to be able to find the etcher-util
// binary. We should instead export a function that asks the main process to launch
// the binary itself.
export async function getEtcherUtilPath(): Promise<string> {
	const utilPath = await ipcRenderer.invoke('get-util-path');
	console.log(utilPath);
	return utilPath;
}

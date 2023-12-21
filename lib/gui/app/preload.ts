// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import * as webapi from '../webapi';

declare global {
	interface Window {
		etcher: typeof webapi;
	}
}

window['etcher'] = webapi;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { main } from './app';
import './i18n';
import { langParser } from './i18n';
import { ipcRenderer } from 'electron';

ipcRenderer.send('change-lng', langParser());

if (module.hot) {
	module.hot.accept('./app', () => {
		main();
	});
}

main();

// @ts-nocheck
import { main } from './app';
import './i18n';
import { ipcRenderer } from 'electron';

let lang = Intl.DateTimeFormat().resolvedOptions().locale;
lang = lang.substr(0, 2);
ipcRenderer.send('change-lng', lang);

if (module.hot) {
	module.hot.accept('./app', () => {
		main();
	});
}

main();

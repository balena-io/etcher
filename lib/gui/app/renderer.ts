// @ts-nocheck
import { main } from './app';

if (module.hot) {
	module.hot.accept('./app', () => {
		main();
	});
}

main();

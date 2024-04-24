import { browser } from '@wdio/globals';

describe('Electron Testing', () => {
	it('should print application title', async () => {
		console.log('Hello', await browser.getTitle(), 'application!');
	});
});

import '@wdio/globals';
import {
	prepare,
	itShouldSelectVirtualTarget,
	itShouldStartFlashing,
	itShouldGetTheFlashCompletedScreen,
	itShouldGetBackToHomeScreen,
} from './e2e-common';

describe('Flash From File E2E Test', () => {
	before(prepare);

	it('should select a file as source', async () => {
		const flashFromFileButton = $('button[data-testid="flash-from-file"]');
		await flashFromFileButton.waitForClickable({ timeout: 10000 });
		await flashFromFileButton.click();
	});

	itShouldSelectVirtualTarget();
	itShouldStartFlashing();
	itShouldGetTheFlashCompletedScreen();
	itShouldGetBackToHomeScreen();
});

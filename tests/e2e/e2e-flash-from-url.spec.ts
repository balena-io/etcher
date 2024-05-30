import '@wdio/globals';
import {
	prepare,
	itShouldSelectVirtualTarget,
	itShouldStartFlashing,
	itShouldGetTheFlashCompletedScreen,
	itShouldGetBackToHomeScreen,
} from './e2e-common';

describe('Flash From URL E2E test', () => {
	before(prepare);

	it('should select an url as source', async () => {
		const flashFromUrlButton = $('button[data-testid="flash-from-url"]');
		await flashFromUrlButton.waitForClickable({ timeout: 10000 });
		await flashFromUrlButton.click();

		const enterValidUrlInput = $('input[data-testid="source-url-input"]');
		await enterValidUrlInput.waitForDisplayed({ timeout: 10000 });
		await enterValidUrlInput.setValue(process.env.TEST_SOURCE_URL as string);

		const sourceUrlOkButton = $('button[data-testid="source-url-ok"]');
		await sourceUrlOkButton.waitForClickable({ timeout: 10000 });
		await sourceUrlOkButton.click();
	});

	itShouldSelectVirtualTarget();
	itShouldStartFlashing();
	itShouldGetTheFlashCompletedScreen();
	itShouldGetBackToHomeScreen();
});

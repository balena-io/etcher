import { browser } from '@wdio/globals';

const prepare = () => {
	browser.pause(2000);
};

const itShouldSelectVirtualTarget = () => {
	it('should "select a virtual target"', async () => {
		const selectTargetButton = $('button[data-testid="select-target"]');
		await selectTargetButton.waitForClickable({ timeout: 30000 });
		await selectTargetButton.click();

		// target drive is set in the github custom test action
		// if you run the test locally, pass the varibale
		const targetVirtualDrive = $(`=${process.env.TARGET_DRIVE}`);
		await targetVirtualDrive.waitForClickable({ timeout: 10000 });
		await targetVirtualDrive.click();

		const validateTargetButton = $(
			'button[data-testid="validate-target-button"]',
		);
		await validateTargetButton.waitForClickable({ timeout: 10000 });
		await validateTargetButton.click();
	});
};

const itShouldStartFlashing = () => {
	it('should "start flashing"', async () => {
		const flashNowButton = $('button[data-testid="flash-now"]');
		await flashNowButton.waitForClickable({ timeout: 10000 });
		await flashNowButton.click();
	});
};

const itShouldGetTheFlashCompletedScreen = () => {
	it('should get the "Flash Completed" screen', async () => {
		const flashResults = $('[data-testid="flash-results"]');
		// 5' should be enough from CI, but might be too short for local testing on slow connections
		await flashResults.waitForDisplayed({ timeout: 300000 });

		const flashResultsText = await flashResults.getText();
		expect(flashResultsText).toBe('Flash Completed!');
	});
};

const itShouldGetBackToHomeScreen = () => {
	it('should get back to the "Home" screen', async () => {
		const flashAnotherButton = $('button[data-testid="flash-another"]');

		await flashAnotherButton.waitForClickable({ timeout: 10000 });
		await flashAnotherButton.click();

		// previously flashes image is still seclected, remove it
		const changeSource = $('button[data-testid="change-image"]');

		await changeSource.waitForClickable({ timeout: 10000 });
		await changeSource.click();

		// we're good;
	});
};

export {
	prepare,
	itShouldSelectVirtualTarget,
	itShouldStartFlashing,
	itShouldGetTheFlashCompletedScreen,
	itShouldGetBackToHomeScreen,
};

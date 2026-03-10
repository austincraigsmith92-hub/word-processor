const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Privacy Mode', () => {
    test('Toggles privacy mode and hides UI', async ({ page }) => {
        const filePath = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(filePath);

        // Check normal state
        await expect(page.locator('#control-panel')).toBeVisible();

        // Enter privacy mode
        await page.click('#btn-privacy');

        // Verifying the body has the class
        await expect(page.locator('body')).toHaveClass(/privacy-mode/);

        // Ensure floating stop button is visible
        const floatingBtn = page.locator('#btn-stop-floating');
        await expect(floatingBtn).not.toHaveClass(/hidden/);

        // Exit privacy mode
        await floatingBtn.click();
        await expect(page.locator('body')).not.toHaveClass(/privacy-mode/);
    });
});

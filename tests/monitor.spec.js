const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Monitor Logic', () => {
    test('Typing registers heartbeat and updates status indicator', async ({ page }) => {
        const filePath = 'file://' + path.resolve(__dirname, '../index.html');
        await page.goto(filePath);

        await page.click('#btn-start');
        await expect(page.locator('#status-text')).toHaveText('Active');

        await page.fill('#editor', 'Hello world');
        await expect(page.locator('#word-count')).toHaveText('2 words');
    });
});

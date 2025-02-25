const { test, expect } = require('@playwright/test');

test.describe('Тестирование лендинга Vacuu', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://polis812.github.io/vacuu/');
    });

    test('Проверка заголовка страницы', async ({ page }) => {
        await expect(page).toHaveTitle(/vacuu/i); // Исправлено в соответствии с реальным заголовком
    });

    test('Проверка наличия основных кнопок', async ({ page }) => {
        const buttons = await page.$$('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    test('Проверка работы всех ссылок', async ({ page }) => {
        const links = await page.$$('[href]');
        for (const link of links) {
            const href = await link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                await link.click();
                await page.waitForLoadState();
                expect(page.url()).toContain(href);
                await page.goBack();
            }
        }
    });

    test('Проверка мобильной версии', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await expect(page).toHaveScreenshot();
    });

    test('Проверка отсутствия ошибок в консоли', async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => {
            errors.push(error.message);
        });
        await page.reload();
        expect(errors.length).toBe(0);
    });
});

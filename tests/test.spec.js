const { test, expect } = require('@playwright/test');
const fs = require('fs');

let errors = []; // Сюда будем собирать ошибки для отчета

test.describe('Тестирование лендинга Vacuu', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://polis812.github.io/vacuu/');
    });

    test('1. Страница успешно загружается', async ({ page }) => {
        const status = await page.evaluate(() => document.readyState);
        if (status !== 'complete') {
            errors.push('Страница не загрузилась полностью');
        }
        expect.soft(status).toBe('complete');
    });

    test('2. Заголовок страницы содержит "vacuu"', async ({ page }) => {
        const title = await page.title();
        if (!/vacuu/i.test(title)) {
            errors.push(`Заголовок страницы "${title}" не содержит "vacuu"`);
        }
        expect.soft(title).toMatch(/vacuu/i);
    });

    test('3. На странице есть хотя бы одна кнопка <button>', async ({ page }) => {
        const buttons = await page.locator('button').count();
        if (buttons === 0) {
            errors.push('На странице нет кнопок <button>');
        }
        expect.soft(buttons).toBeGreaterThan(0);
    });

    test('4. Проверка работы всех ссылок', async ({ page }) => {
        const links = await page.locator('a');
        for (const link of await links.all()) {
            const href = await link.getAttribute('href');
            if (!href) continue;
            
            if (!href.startsWith('#')) { // Проверяем внешние ссылки
                const [newPage] = await Promise.all([
                    page.waitForEvent('popup'),
                    link.click()
                ]).catch(() => [null]);

                if (newPage) {
                    await newPage.waitForLoadState();
                    const newURL = newPage.url();
                    if (!newURL.startsWith('http')) {
                        errors.push(`Ссылка ${href} ведет на некорректную страницу`);
                    }
                    await newPage.close();
                } else {
                    const newURL = page.url();
                    if (!newURL.includes(href)) {
                        errors.push(`Ссылка ${href} не работает`);
                    }
                    await page.goBack();
                }
            }
        }
    });

    test('5. Проверка мобильной версии', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(1000); // Подождем перестроение

        const path = 'test-results';
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }

        const screenshot = await page.screenshot();
        fs.writeFileSync(`${path}/test-screenshot.png`, screenshot);
    });

    test('6. Проверка наличия ошибок в консоли', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.reload();
        if (consoleErrors.length > 0) {
            errors.push(`Обнаружены ошибки в консоли: ${consoleErrors.join('; ')}`);
        }
        expect.soft(consoleErrors.length).toBe(0);
    });

    test.afterAll(async () => {
        fs.writeFileSync('test-results/test-report.json', JSON.stringify(errors, null, 2));
    });

});

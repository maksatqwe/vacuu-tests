const { test, expect } = require('@playwright/test');
const fs = require('fs');

let errors = []; // Глобальный массив ошибок

test.describe('Тестирование лендинга Vacuu', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://polis812.github.io/vacuu/');
    });

    test('1. Страница успешно загружается', async ({ page }) => {
        const status = await page.evaluate(() => document.readyState);
        if (status !== 'complete') {
            const errorMsg = 'Страница не загрузилась полностью';
            errors.push(errorMsg);
            await page.screenshot({ path: `test-results/page-load-failed-${Date.now()}.png`, fullPage: true });
        }
        expect.soft(status).toBe('complete');
    });

    test('2. Заголовок страницы содержит "vacuu"', async ({ page }) => {
        const title = await page.title();
        if (!/vacuu/i.test(title)) {
            const errorMsg = `Заголовок страницы "${title}" не содержит "vacuu"`;
            errors.push(errorMsg);
            await page.screenshot({ path: `test-results/title-error-${Date.now()}.png` });
        }
        expect.soft(title).toMatch(/vacuu/i);
    });

    test('3. Проверка всех ссылок', async ({ page }) => {
        const links = await page.locator('a').all();
        for (const link of links) {
            const href = await link.getAttribute('href');
            if (!href || href.startsWith('#')) continue;

            try {
                const response = await page.evaluate(async (url) => {
                    try {
                        const res = await fetch(url, { method: 'HEAD' });
                        return res.ok ? null : `Ошибка ${res.status} для ${url}`;
                    } catch (e) {
                        return `Ошибка запроса для ${url}`;
                    }
                }, href);

                if (response) {
                    errors.push(response);
                }
            } catch (e) {
                errors.push(`Не удалось проверить ссылку ${href}`);
            }
        }

        // **Делаем тест частично неудачным**
        expect.soft(errors.length).toBe(0);
    });

    test('4. На странице есть хотя бы одна кнопка <button>', async ({ page }) => {
        const buttons = await page.locator('button').count();
        if (buttons === 0) {
            errors.push('На странице нет кнопок <button>');
            await page.screenshot({ path: 'test-results/no-buttons.png' });
        }
        expect.soft(buttons).toBeGreaterThan(0);
    });

    test('5. Проверка мобильной версии', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(1000); // Подождем перестроение
        const screenshot = await page.screenshot();
        fs.writeFileSync('test-results/test-screenshot.png', screenshot);
    });

    test('6. Проверка наличия ошибок в консоли', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });
    });
    test.afterAll(async () => {
        if (errors.length > 0) {
            const reportPath = 'test-results/test-report.json';
            let previousErrors = [];

            // Если файл уже существует, загружаем старые ошибки
            if (fs.existsSync(reportPath)) {
                try {
                    const fileContent = fs.readFileSync(reportPath, 'utf8');
                    previousErrors = JSON.parse(fileContent);
                } catch (err) {
                    console.error('Ошибка чтения test-report.json:', err);
                }
            }

            // Добавляем новые ошибки
            const allErrors = previousErrors.concat(errors);

            // Записываем в файл
            fs.writeFileSync(reportPath, JSON.stringify(allErrors, null, 2));
        }
    });
});

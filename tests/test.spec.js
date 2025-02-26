import { test, expect } from '@playwright/test';
import fs from 'fs';

let errors = [];

test.describe('Тестирование лендинга Vacuu', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('https://polis812.github.io/vacuu/'); // Замени на реальный URL
    });

    test('1. Страница загружается без ошибок', async ({ page }) => {
        const response = await page.waitForResponse(response => response.status() === 200, { timeout: 10000 })
            .catch(() => null);
        if (!response) {
            errors.push('Страница не загрузилась или вернула ошибку');
        }
    });

    test('2. Заголовок страницы содержит "vacuu"', async ({ page }) => {
        const title = await page.title();
        if (!/vacuu/i.test(title)) {
            errors.push(`Заголовок страницы "${title}" не содержит "vacuu"`);
        }
    });

    test('3. На странице есть хотя бы одна кнопка <button>', async ({ page }) => {
        const buttons = await page.locator('button').count();
        if (buttons === 0) {
            errors.push('На странице нет кнопок <button>');
        }
    });

    test('4. Проверка работы всех ссылок', async ({ page }) => {
        try {
            const links = await page.locator('a').all();
            for (const link of links) {
                const href = await link.getAttribute('href');
                if (href) {
                    const response = await page.goto(href, { timeout: 10000 }).catch(() => null);
                    if (!response || !response.ok()) {
                        errors.push(`Ссылка ${href} не работает`);
                    }
                    await page.goBack().catch(() => {}); // Чтобы тест не падал
                }
            }
        } catch (error) {
            errors.push(`Ошибка при проверке ссылок: ${error.message}`);
        }
    });

    test('5. Проверка наличия изображения с логотипом', async ({ page }) => {
        const logo = await page.locator('img[alt="Vacuu Logo"]').count();
        if (logo === 0) {
            errors.push('Логотип не найден на странице');
        }
    });

    test('6. Форма обратной связи доступна', async ({ page }) => {
        const formExists = await page.locator('form#contact-form').count();
        if (formExists === 0) {
            errors.push('Форма обратной связи отсутствует');
        }
    });

    test.afterAll(async () => {
        const report = {
            timestamp: new Date().toISOString(),
            errors,
            status: errors.length === 0 ? 'PASSED' : 'FAILED'
        };
        fs.writeFileSync('report.json', JSON.stringify(report, null, 2));
        console.log('Тест завершён. Отчёт сохранён в report.json');
    });

});

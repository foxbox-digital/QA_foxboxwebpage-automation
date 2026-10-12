const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-85: /ai-native-assessment is missing all four social meta tags.
// Sharing the URL on LinkedIn, Slack, or Twitter produces a blank card.
test.describe('FOX2-85 — /ai-native-assessment social meta tags', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/ai-native-assessment');
    });

    test('should have og:image with non-empty content', async ({ page }) => {
        const content = await page.evaluate(() =>
            document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? null
        );
        expect(content, 'og:image meta tag is missing or empty').toBeTruthy();
    });

    test('should have og:description with non-empty content', async ({ page }) => {
        const content = await page.evaluate(() =>
            document.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? null
        );
        expect(content, 'og:description meta tag is missing or empty').toBeTruthy();
    });

    test('should have twitter:card with non-empty content', async ({ page }) => {
        const content = await page.evaluate(() =>
            document.querySelector('meta[name="twitter:card"]')?.getAttribute('content') ?? null
        );
        expect(content, 'twitter:card meta tag is missing or empty').toBeTruthy();
    });

    test('should have twitter:image with non-empty content', async ({ page }) => {
        const content = await page.evaluate(() =>
            document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ?? null
        );
        expect(content, 'twitter:image meta tag is missing or empty').toBeTruthy();
    });
});

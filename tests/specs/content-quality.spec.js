const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-212: Content quality issues confirmed in production crawl (2026-09-28):
//   - Homepage: 4 images have alt=""
//   - /case-studies: meta description is only 43 chars (trailing space; well below 80)
//   - /services: page title does not include the brand name "Foxbox"
test.describe('FOX2-212 — Content quality', () => {
    test('homepage should have no images with empty alt attributes', async ({ page }) => {
        await page.goto('/');
        const emptyAltSrcs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('img[alt=""]'), img => img.src)
        );
        expect(
            emptyAltSrcs,
            `${emptyAltSrcs.length} image(s) with empty alt: ${emptyAltSrcs.join(', ')}`
        ).toHaveLength(0);
    });

    test('homepage should have exactly one H1', async ({ page }) => {
        await page.goto('/');
        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);
    });

    test('case-studies meta description should be at least 80 characters', async ({ page }) => {
        await page.goto('/case-studies/');
        const content = await page.locator('meta[name="description"]').getAttribute('content');
        expect(content, 'Meta description tag is missing').toBeTruthy();
        expect(
            content.trim().length,
            `Meta description is too short (${content.trim().length} chars): "${content.trim()}"`
        ).toBeGreaterThanOrEqual(80);
    });

    test('services page title should include the Foxbox brand name', async ({ page }) => {
        await page.goto('/services/');
        const title = await page.title();
        expect(title.toLowerCase(), `Title "${title}" does not include "foxbox"`).toContain('foxbox');
    });
});

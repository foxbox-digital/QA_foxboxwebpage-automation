const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-137: Fix next/image layout prop in ImageComponent
// The `layout` prop was removed in Next.js 15. ImageComponent.tsx still passes
// it to <Image>, causing image sizing to be silently broken in production.
// These tests verify that images on key pages load with valid natural dimensions.
test.describe('SC45 - Image Rendering (FOX2-137)', () => {
    const KEY_PAGES = [
        { label: 'homepage', path: '/' },
        { label: '/about', path: '/about' },
        { label: 'K Health case study', path: '/case-studies/k-health-ai-healthcare-case-study' },
    ];

    KEY_PAGES.forEach(({ label, path }, i) => {
        const tc = String(i + 1).padStart(2, '0');

        test(`SC45-TC${tc} - No broken images on ${label}`, async ({ page }) => {
            await page.goto(path);
            await page.waitForLoadState('domcontentloaded');

            const brokenSrcs = await page.evaluate(() =>
                Array.from(document.querySelectorAll('img')).filter(
                    (img) =>
                        img.complete &&
                        img.naturalWidth === 0 &&
                        img.src &&
                        !img.src.startsWith('data:') &&
                        !img.src.startsWith('blob:')
                ).map((img) => img.src)
            );

            expect(
                brokenSrcs,
                `Broken images (loaded but 0 naturalWidth) on ${label}: ${brokenSrcs.join(', ')}`
            ).toHaveLength(0);
        });
    });

    test('SC45-TC04 - No images rendered at 0×0 dimensions on /about', async ({ page }) => {
        await page.goto('/about');
        await page.waitForLoadState('domcontentloaded');

        // Images rendered with no visible size indicate the layout prop regression:
        // the wrapper collapses when Next.js ignores the removed `layout` prop.
        const zeroDimensionSrcs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('main img')).filter((img) => {
                if (!img.src || img.src.startsWith('data:')) return false;
                const rect = img.getBoundingClientRect();
                return rect.width === 0 || rect.height === 0;
            }).map((img) => img.src)
        );

        expect(
            zeroDimensionSrcs,
            `Images rendered at 0×0 (invisible) on /about: ${zeroDimensionSrcs.join(', ')}`
        ).toHaveLength(0);
    });

    test('SC45-TC05 - No images rendered at 0×0 dimensions on case study page', async ({ page }) => {
        await page.goto('/case-studies/k-health-ai-healthcare-case-study');
        await page.waitForLoadState('domcontentloaded');

        const zeroDimensionSrcs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('main img')).filter((img) => {
                if (!img.src || img.src.startsWith('data:')) return false;
                const rect = img.getBoundingClientRect();
                return rect.width === 0 || rect.height === 0;
            }).map((img) => img.src)
        );

        expect(
            zeroDimensionSrcs,
            `Images rendered at 0×0 (invisible) on case study: ${zeroDimensionSrcs.join(', ')}`
        ).toHaveLength(0);
    });
});

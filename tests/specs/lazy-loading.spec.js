const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-151: Add loading="lazy" to below-fold images
// Author photos, team photos, and content images served directly from the Sanity
// CDN (raw <img> tags, not via Next.js Image) were loading eagerly on initial page
// load. Next.js Image components manage their own deferred loading; this suite
// targets only the unmanaged <img> tags that FOX2-151 fixes.
//
// Note: these tests are EXPECTED TO FAIL on production until FOX2-151 (PR #307)
// is merged. They serve as the acceptance criteria for that PR.
test.describe('SC46 - Lazy Loading for Below-fold Images (FOX2-151)', () => {
    /**
     * Returns src+loading pairs for every raw CDN <img> whose absolute top offset
     * exceeds the viewport height (i.e. starts below the fold at scroll=0).
     * Excludes data URIs, blob URLs, and images served via Next.js Image optimization
     * (/_next/image) since those have their loading strategy managed by the framework.
     */
    async function getBelowFoldCdnImages(page) {
        return page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
                .filter((img) => {
                    if (!img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) return false;
                    // Next.js Image outputs use /_next/image for the optimized src;
                    // those are framework-managed and not the target of FOX2-151.
                    if (img.src.includes('/_next/image')) return false;
                    const topOffset = img.getBoundingClientRect().top + window.scrollY;
                    return topOffset > window.innerHeight;
                })
                .map((img) => ({ src: img.src, loading: img.getAttribute('loading') }));
        });
    }

    test('SC46-TC01 - Raw CDN images below the fold on /about have loading="lazy"', async ({ page }) => {
        await page.goto('/about');
        await page.waitForLoadState('domcontentloaded');

        const belowFold = await getBelowFoldCdnImages(page);
        const eager = belowFold.filter((img) => img.loading !== 'lazy');

        expect(
            eager,
            `Below-fold CDN images without loading="lazy" on /about:\n${eager.map((i) => i.src).join('\n')}`
        ).toHaveLength(0);
    });

    test('SC46-TC02 - Raw CDN images below the fold on a blog post have loading="lazy"', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        const firstPostHref = await page
            .locator('a[href^="/blog/"]:not([href^="/blog/page/"])')
            .first()
            .getAttribute('href');
        await page.goto(firstPostHref);
        await page.waitForLoadState('domcontentloaded');

        const belowFold = await getBelowFoldCdnImages(page);
        const eager = belowFold.filter((img) => img.loading !== 'lazy');

        expect(
            eager,
            `Below-fold CDN images without loading="lazy" on blog post ${firstPostHref}:\n${eager.map((i) => i.src).join('\n')}`
        ).toHaveLength(0);
    });

    test('SC46-TC03 - Raw CDN images below the fold on homepage have loading="lazy"', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const belowFold = await getBelowFoldCdnImages(page);
        const eager = belowFold.filter((img) => img.loading !== 'lazy');

        expect(
            eager,
            `Below-fold CDN images without loading="lazy" on homepage:\n${eager.map((i) => i.src).join('\n')}`
        ).toHaveLength(0);
    });

    test('SC46-TC04 - Raw CDN images below the fold on case study page have loading="lazy"', async ({ page }) => {
        await page.goto('/case-studies/k-health-ai-healthcare-case-study');
        await page.waitForLoadState('domcontentloaded');

        const belowFold = await getBelowFoldCdnImages(page);
        const eager = belowFold.filter((img) => img.loading !== 'lazy');

        expect(
            eager,
            `Below-fold CDN images without loading="lazy" on K Health case study:\n${eager.map((i) => i.src).join('\n')}`
        ).toHaveLength(0);
    });
});

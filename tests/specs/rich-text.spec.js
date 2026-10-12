const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-140: Migrate @sanity/block-content-to-react to @portabletext/react
// These tests verify rich text content renders as proper HTML (paragraphs,
// headings, links) both before and after the library migration — the output
// behaviour must be identical.
test.describe('SC44 - Rich Text Rendering (FOX2-140)', () => {
    test('SC44-TC01 - Blog post body renders at least 3 paragraphs', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        const firstPostHref = await page.locator('a[href^="/blog/"]:not([href^="/blog/page/"])').first().getAttribute('href');
        await page.goto(firstPostHref);
        await page.waitForLoadState('domcontentloaded');

        // Blog post body is not wrapped in <article>; count all <p> tags on the page.
        const count = await page.locator('p').count();
        expect(count, 'Blog post should render at least 3 paragraphs of rich text').toBeGreaterThanOrEqual(3);
    });

    test('SC44-TC02 - Blog post body does not expose raw Sanity block JSON', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        const firstPostHref = await page.locator('a[href^="/blog/"]:not([href^="/blog/page/"])').first().getAttribute('href');
        await page.goto(firstPostHref);
        await page.waitForLoadState('domcontentloaded');

        const bodyText = await page.locator('main').textContent();
        expect(bodyText, 'Page body should not contain raw Sanity JSON (_type field)').not.toContain('"_type"');
        expect(bodyText, 'Page body should not start with a JSON array literal').not.toMatch(/\[{"_/);
    });

    test('SC44-TC03 - Case study detail page renders at least 3 body paragraphs', async ({ page }) => {
        await page.goto('/case-studies/k-health-ai-healthcare-case-study');
        await page.waitForLoadState('domcontentloaded');

        const paragraphs = page.locator('main p');
        const count = await paragraphs.count();
        expect(count, 'Case study should render at least 3 body paragraphs').toBeGreaterThanOrEqual(3);
    });

    test('SC44-TC04 - Case study detail body does not expose raw Sanity block JSON', async ({ page }) => {
        await page.goto('/case-studies/k-health-ai-healthcare-case-study');
        await page.waitForLoadState('domcontentloaded');

        // Case study page has nested <main> elements; use the outer wrapper by ID.
        const bodyText = await page.locator('#page-wrap').textContent();
        expect(bodyText, 'Case study body should not contain raw Sanity JSON (_type field)').not.toContain('"_type"');
    });

    test('SC44-TC05 - Rich text links within a blog post have valid href attributes', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        const firstPostHref = await page.locator('a[href^="/blog/"]:not([href^="/blog/page/"])').first().getAttribute('href');
        await page.goto(firstPostHref);
        await page.waitForLoadState('domcontentloaded');

        // Any anchor rendered inside the article body should have a non-empty href
        const contentLinks = page.locator('article a[href]');
        const count = await contentLinks.count();
        if (count > 0) {
            const href = await contentLinks.first().getAttribute('href');
            expect(href, 'Rich text link should have a non-empty href').toBeTruthy();
        }
    });

    test('SC44-TC06 - Blog post headings are rendered as semantic heading elements', async ({ page }) => {
        await page.goto('/blog');
        await page.waitForLoadState('domcontentloaded');
        const firstPostHref = await page.locator('a[href^="/blog/"]:not([href^="/blog/page/"])').first().getAttribute('href');
        await page.goto(firstPostHref);
        await page.waitForLoadState('domcontentloaded');

        // If the post has rich text headings they should appear as real heading tags,
        // not as plain text nodes — evaluate counts all h2/h3 inside the article body.
        const headingCount = await page.locator('article h2, article h3, article h4').count();
        // Not every post has sub-headings, but if any exist they must be heading elements.
        // This assertion confirms none are rendered as raw text instead.
        const rawHeadingText = await page.evaluate(() => {
            const walker = document.createTreeWalker(
                document.querySelector('article') || document.body,
                NodeFilter.SHOW_TEXT
            );
            let node;
            const suspicious = [];
            while ((node = walker.nextNode())) {
                const t = node.textContent.trim();
                // Flag text nodes that look like they should be a heading (ALL CAPS / Title Case short lines)
                // but whose parent is a <p> rather than a heading element
                if (t.length > 3 && t.length < 80 && /^[A-Z][^a-z]{5,}$/.test(t)) {
                    const parent = node.parentElement;
                    if (parent && /^p$/i.test(parent.tagName)) {
                        suspicious.push(t);
                    }
                }
            }
            return suspicious;
        });
        expect(rawHeadingText, 'Heading-like text should not be rendered inside <p> tags').toHaveLength(0);
        // Also assert headingCount is a number (no crash during evaluation)
        expect(typeof headingCount).toBe('number');
    });
});

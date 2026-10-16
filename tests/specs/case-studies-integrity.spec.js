const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

const CASE_STUDY_URL = '/case-studies/turning-care-coordination-into-a-conversation';

// FOX2-126: Technology filter visible on index; technology list sorted A→Z on detail pages
test.describe('FOX2-126 — Technology filter and alphabetical detail list', () => {
    test('technology filter label is visible on /case-studies/', async ({ page }) => {
        await page.goto('/case-studies/');
        await expect(page.getByText('Technology')).toBeVisible();
    });

    test('technology list on case study detail page is sorted A→Z', async ({ page }) => {
        await page.goto(CASE_STUDY_URL);
        const techLinks = page.locator('a[href*="?technology="]');
        await expect(techLinks.first()).toBeVisible();
        const texts = await techLinks.allTextContents();
        const sorted = [...texts].sort((a, b) =>
            a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        expect(texts, `Technology list is not sorted A→Z. Got: ${texts.join(', ')}`).toEqual(sorted);
    });
});

// FOX2-127: Offering items on case study detail pages link to service pages
test.describe('FOX2-127 — Case study offerings link to service pages', () => {
    test('offering items in the sidebar are linked, not plain text', async ({ page }) => {
        await page.goto(CASE_STUDY_URL);
        const offeringLinksNearSection = await page.evaluate(() => {
            const allEls = Array.from(document.querySelectorAll('*'));
            const heading = allEls.find(
                el => el.children.length === 0 && el.textContent.trim() === 'Offerings'
            );
            if (!heading) return 0;
            const container = heading.closest('section, aside, div');
            return container ? container.querySelectorAll('a[href]').length : 0;
        });
        expect(
            offeringLinksNearSection,
            'Offering items appear to be plain text — no links found in the Offerings section'
        ).toBeGreaterThan(0);
    });
});

// FOX2-131: All case studies present in server-rendered DOM — no JS-only Load More
test.describe('FOX2-131 — Case studies server-rendered without JS-only Load More', () => {
    test('all case study cards are in the initial DOM on page load', async ({ page }) => {
        await page.goto('/case-studies/');
        const cards = page.locator('a[href^="/case-studies/"]');
        const count = await cards.count();
        expect(
            count,
            `Only ${count} case study cards found — expected all to be server-rendered`
        ).toBeGreaterThan(10);
    });

    test('no Load More button is present that could hide content from crawlers', async ({ page }) => {
        await page.goto('/case-studies/');
        await expect(page.getByRole('button', { name: /load more/i })).toHaveCount(0);
    });
});

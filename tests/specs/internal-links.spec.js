const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-209: Regression guard — doubled path segments (e.g. /case-studies/case-studies/)
// were observed in production. Confirmed clean on 2026-09-28; this test prevents recurrence.
const PAGES_TO_CHECK = ['/', '/case-studies/', '/services/', '/about/us'];

test.describe('FOX2-209 — No doubled path segments in internal links', () => {
    for (const path of PAGES_TO_CHECK) {
        test(`${path} has no doubled path hrefs`, async ({ page }) => {
            await page.goto(path);
            const hrefs = await page.evaluate(() =>
                Array.from(document.querySelectorAll('a[href^="/"]'), a => a.getAttribute('href'))
            );
            const doubled = hrefs.filter(href => /\/([^/]+)\/\1(\/|$)/.test(href));
            expect(doubled, `Doubled-segment hrefs found: ${doubled.join(', ')}`).toHaveLength(0);
        });
    }
});

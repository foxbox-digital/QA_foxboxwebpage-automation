const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-202: /about/agentic-engineering and /about/approach must permanently redirect
// to the new /approach/* section added in the feat(FOX2-202) deploy (2026-09-29).
test.describe('FOX2-202 — /about/agentic-engineering and /about/approach use permanent redirects', () => {
    async function captureRedirectChain(page, pathname) {
        const statuses = [];
        let finalUrl = null;
        page.on('response', response => {
            try {
                const url = new URL(response.url());
                if (url.pathname === pathname || url.pathname === pathname + '/') {
                    statuses.push(response.status());
                }
                if (response.status() >= 300 && response.status() < 400) {
                    finalUrl = response.headers()['location'] || finalUrl;
                }
            } catch {
                // ignore non-parseable URLs
            }
        });
        await page.goto(pathname);
        return { statuses, finalUrl, landedOn: new URL(page.url()).pathname };
    }

    test('/about/agentic-engineering permanently redirects (308) to /approach/agentic-engineering', async ({ page }) => {
        let redirectStatus = null;
        page.on('response', response => {
            try {
                const url = new URL(response.url());
                if ((url.pathname === '/about/agentic-engineering' || url.pathname === '/about/agentic-engineering/') &&
                    response.status() >= 300 && response.status() < 400) {
                    redirectStatus = response.status();
                }
            } catch { /* ignore */ }
        });
        await page.goto('/about/agentic-engineering');
        expect(redirectStatus, 'No redirect captured for /about/agentic-engineering').not.toBeNull();
        expect(redirectStatus, `Expected 308 but got ${redirectStatus}`).toBe(308);
        expect(new URL(page.url()).pathname).toMatch(/^\/approach\/agentic-engineering/);
    });

    test('/about/approach permanently redirects (308) to /approach', async ({ page }) => {
        let redirectStatus = null;
        page.on('response', response => {
            try {
                const url = new URL(response.url());
                if ((url.pathname === '/about/approach' || url.pathname === '/about/approach/') &&
                    response.status() >= 300 && response.status() < 400) {
                    redirectStatus = response.status();
                }
            } catch { /* ignore */ }
        });
        await page.goto('/about/approach');
        expect(redirectStatus, 'No redirect captured for /about/approach').not.toBeNull();
        expect(redirectStatus, `Expected 308 but got ${redirectStatus}`).toBe(308);
        expect(new URL(page.url()).pathname).toMatch(/^\/approach/);
    });
});

// FOX2-210: /about and /culture currently issue 307 Temporary redirects.
// They must be 301 or 308 (Permanent) so browsers cache them and link equity passes.
test.describe('FOX2-210 — /about and /culture should use permanent redirects', () => {
    async function captureRedirectStatus(page, pathname) {
        let redirectStatus = null;
        page.on('response', response => {
            try {
                const url = new URL(response.url());
                const isRedirect = response.status() >= 300 && response.status() < 400;
                if ((url.pathname === pathname || url.pathname === pathname + '/') && isRedirect) {
                    redirectStatus = response.status();
                }
            } catch {
                // ignore non-parseable URLs (e.g. data: or blob:)
            }
        });
        await page.goto(pathname);
        return redirectStatus;
    }

    test('/about should redirect with 301 or 308, not temporary 307', async ({ page }) => {
        const status = await captureRedirectStatus(page, '/about');
        expect(status, 'No redirect was captured for /about').not.toBeNull();
        expect([301, 308], `Expected permanent redirect but got ${status}`).toContain(status);
    });

    test('/culture should redirect with 301 or 308, not temporary 307', async ({ page }) => {
        const status = await captureRedirectStatus(page, '/culture');
        expect(status, 'No redirect was captured for /culture').not.toBeNull();
        expect([301, 308], `Expected permanent redirect but got ${status}`).toContain(status);
    });
});

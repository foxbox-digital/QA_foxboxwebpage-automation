const { test, expect } = require('@playwright/test');

test.use({ baseURL: 'https://foxbox.com' });

// FOX2-98: All internal links updated from old /work/ path to /case-studies/
test.describe('FOX2-98 — Site nav and internal links point to /case-studies/', () => {
    test('no internal links on homepage point to the old /work/ path', async ({ page }) => {
        await page.goto('/');
        const hrefs = await page.evaluate(() =>
            Array.from(document.querySelectorAll('a[href]'), a => a.getAttribute('href'))
        );
        const staleLinks = hrefs.filter(href =>
            href === '/work' || href === '/work/' || href.startsWith('/work/')
        );
        expect(staleLinks, `Stale /work/ links found: ${staleLinks.join(', ')}`).toHaveLength(0);
    });

    test('footer "Our Work" link points to /case-studies/', async ({ page }) => {
        await page.goto('/');
        const link = page.getByRole('link', { name: 'Our Work' });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', '/case-studies');
    });
});

// FOX2-202: "Approach" and "Agentic Engineering" links appear under Company in the nav mega-menu.
// The mega-menu is hidden until the "Menu" button is clicked — tests must open it first.
test.describe('FOX2-202 — Company nav column shows Approach and Agentic Engineering links', () => {
    async function openMegaNav(page) {
        await page.goto('/');
        await page.getByRole('button', { name: 'Menu' }).click();
        // Wait for nav links to become visible
        await page.waitForSelector('a[href="/approach"]', { state: 'visible' });
    }

    test('nav Company column contains Approach link pointing to /approach (not footer)', async ({ page }) => {
        await openMegaNav(page);
        // Scope to the nav element to avoid matching the footer link
        const nav = page.locator('nav');
        const approachLink = nav.getByRole('link', { name: 'Approach', exact: true });
        await expect(approachLink).toHaveAttribute('href', '/approach');
    });

    test('nav Company column contains Agentic Engineering link pointing to /approach/agentic-engineering', async ({ page }) => {
        await openMegaNav(page);
        const nav = page.locator('nav');
        const agenticLink = nav.getByRole('link', { name: 'Agentic Engineering', exact: true });
        await expect(agenticLink).toHaveAttribute('href', '/approach/agentic-engineering');
    });

    test('/approach/agentic-engineering page loads and shows expected heading', async ({ page }) => {
        await page.goto('/approach/agentic-engineering');
        await expect(page).toHaveURL(/\/approach\/agentic-engineering/);
        await expect(page.getByRole('heading', { name: /Agentic Engineering|Our Approach/i }).first()).toBeVisible();
    });

    test('/approach page loads without "Page not found" content', async ({ page }) => {
        await page.goto('/approach');
        await expect(page).toHaveURL(/\/approach/);
        const body = await page.textContent('body');
        expect(body).not.toMatch(/page not found/i);
    });
});

// FOX2-130: /case-studies added to nav revalidation paths — page is accessible and renders content
test.describe('FOX2-130 — /case-studies/ accessible and reachable from nav', () => {
    test('/case-studies/ loads and shows case study cards', async ({ page }) => {
        await page.goto('/case-studies/');
        const cards = page.locator('a[href^="/case-studies/"]');
        await expect(cards.first()).toBeVisible();
        const count = await cards.count();
        expect(count, 'No case study cards found on /case-studies/').toBeGreaterThan(0);
    });

    test('clicking footer Our Work link navigates to /case-studies/ and shows cards', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Our Work' }).click();
        await expect(page).toHaveURL(/\/case-studies/);
        await expect(page.locator('a[href^="/case-studies/"]').first()).toBeVisible();
    });
});

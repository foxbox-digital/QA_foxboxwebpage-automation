const { test, expect } = require('@playwright/test');

// FOX2-139: /cms-test is caught by a Next.js catch-all route and returns 200 (soft 404).
// It must return a true HTTP 404 so crawlers and monitoring tools treat it as gone.
test.describe('FOX2-139 — /cms-test should not be publicly accessible', () => {
    test('should return HTTP 404 for /cms-test', async ({ request }) => {
        const response = await request.get('https://foxbox.com/cms-test');
        expect(response.status()).toBe(404);
    });
});

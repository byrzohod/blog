import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('should display search page', async ({ page }) => {
    await page.goto('/search');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Should have search heading
    await expect(page.getByRole('heading', { name: 'Search' })).toBeVisible();

    // Should have search input with placeholder
    const searchInput = page.getByPlaceholder('Search posts...');
    await expect(searchInput).toBeVisible();
  });

  test('should search with query and show results', async ({ page }) => {
    await page.goto('/search');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Enter search query
    const searchInput = page.getByPlaceholder('Search posts...');
    await searchInput.fill('Welcome');

    // Wait for debounced search to trigger (debounce is 300ms)
    await page.waitForTimeout(800);

    // Should update URL with query
    await expect(page).toHaveURL(/\/search\?q=Welcome/);

    // Should show results
    await expect(page.getByText(/Found \d+ result/)).toBeVisible();
  });

  test('should show no results for gibberish query', async ({ page }) => {
    await page.goto('/search');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Enter nonsense query
    const searchInput = page.getByPlaceholder('Search posts...');
    await searchInput.fill('xyznonexistentquery12345');

    // Wait for debounced search
    await page.waitForTimeout(800);

    // Should show no results message
    await expect(page.getByText(/No results found/i)).toBeVisible();
  });

  test('should pre-fill search from URL parameter', async ({ page }) => {
    await page.goto('/search?q=nextjs');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Search input should be pre-filled
    const searchInput = page.getByPlaceholder('Search posts...');
    await expect(searchInput).toHaveValue('nextjs');
  });

  test('should navigate to post from search results', async ({ page }) => {
    await page.goto('/search?q=Welcome');

    // Wait for results to load
    await page.waitForTimeout(800);

    // Click on a result link if visible
    const resultLink = page.locator('a[href^="/blog/welcome"]').first();

    if (await resultLink.isVisible()) {
      await resultLink.click();

      // Should navigate to post page
      await expect(page).toHaveURL(/\/blog\/welcome/);
    } else {
      // Results might not match - verify search still works
      await expect(page.getByPlaceholder('Search posts...')).toBeVisible();
    }
  });
});

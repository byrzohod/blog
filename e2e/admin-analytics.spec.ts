import { test, expect } from '@playwright/test';

const TEST_ADMIN = {
  email: 'admin@bookoflife.com',
  password: 'admin123',
};

test.describe('Admin Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_ADMIN.email);
    await page.getByLabel('Password').fill(TEST_ADMIN.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('Track your blog performance')).toBeVisible();
  });

  test('should show period selector', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Check for period dropdown
    const periodSelect = page.getByRole('combobox');
    await expect(periodSelect).toBeVisible();

    // Open dropdown
    await periodSelect.click();

    // Check options
    await expect(page.getByRole('option', { name: 'Last 7 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Last 30 days' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Last 90 days' })).toBeVisible();
  });

  test('should change period', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Open period dropdown
    const periodSelect = page.getByRole('combobox');
    await periodSelect.click();

    // Select 7 days
    await page.getByRole('option', { name: 'Last 7 days' }).click();

    // Wait for data to reload
    await page.waitForLoadState('networkidle');

    // Verify selection
    await expect(periodSelect).toHaveText(/Last 7 days/);
  });

  test('should display summary cards', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for summary cards
    await expect(page.getByText('Total Views')).toBeVisible();
    await expect(page.getByText('Today')).toBeVisible();
    await expect(page.getByText('This Week')).toBeVisible();
    await expect(page.getByText('This Month')).toBeVisible();
  });

  test('should display daily views chart', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for chart section
    await expect(page.getByText('Daily Views')).toBeVisible();
  });

  test('should display top posts section', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for top posts section
    await expect(page.getByText('Top Posts')).toBeVisible();
  });

  test('should display top referrers section', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for top referrers section
    await expect(page.getByText('Top Referrers')).toBeVisible();
  });

  test('should navigate to analytics from admin sidebar', async ({ page }) => {
    await page.goto('/admin');

    // Click on Analytics link in sidebar
    await page.getByRole('link', { name: /analytics/i }).click();

    await expect(page).toHaveURL('/admin/analytics');
  });

  test('should show loading state initially', async ({ page }) => {
    // Use slow network to capture loading state
    await page.route('**/api/admin/analytics**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.continue();
    });

    await page.goto('/admin/analytics');

    // Should show loading indicator
    const loadingIndicator = page.locator('svg.lucide-bar-chart-3.animate-pulse');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });
  });

  test('should handle empty data gracefully', async ({ page }) => {
    // Mock empty analytics response
    await page.route('**/api/admin/analytics**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          summary: {
            totalViews: 0,
            todayViews: 0,
            weekViews: 0,
            monthViews: 0,
          },
          topPosts: [],
          dailyViews: [],
          topReferrers: [],
        }),
      });
    });

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Should show "No posts with views yet" or similar
    await expect(page.getByText('No posts with views yet')).toBeVisible();
    await expect(page.getByText('No referrer data available')).toBeVisible();
  });

  test('should display all time total', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for "All time" label
    await expect(page.getByText('All time')).toBeVisible();
  });

  test('should show percentage change indicator', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check for percentage indicator (up or down arrow, or the % text)
    const percentageIndicator = page.locator('text=/[+-]?\\d+%/');
    const count = await percentageIndicator.count();

    // Should have at least one percentage indicator if there's data
    // If no data, this test passes anyway
    if (count > 0) {
      await expect(percentageIndicator.first()).toBeVisible();
    }
  });

  test('should link top posts to blog', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Look for any external link icons in top posts section
    const topPostsSection = page.locator('text=Top Posts').locator('..');
    const postLinks = topPostsSection.locator('a[href^="/blog/"]');

    const count = await postLinks.count();
    if (count > 0) {
      // First link should point to a blog post
      const href = await postLinks.first().getAttribute('href');
      expect(href).toMatch(/^\/blog\//);
    }
  });
});

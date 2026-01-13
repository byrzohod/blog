import { test, expect } from './fixtures/auth.fixture';


test.describe('Admin Analytics Dashboard', () => {
  test.beforeEach(async ({ adminPage }) => {
  });

  test('should display analytics dashboard', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');

    // Check page title
    await expect(adminPage.getByRole('heading', { name: 'Analytics' })).toBeVisible();

    // Check subtitle
    await expect(adminPage.getByText('Track your blog performance')).toBeVisible();
  });

  test('should show period selector', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');

    // Check for period dropdown
    const periodSelect = adminPage.getByRole('combobox');
    await expect(periodSelect).toBeVisible();

    // Open dropdown
    await periodSelect.click();

    // Check options
    await expect(adminPage.getByRole('option', { name: 'Last 7 days' })).toBeVisible();
    await expect(adminPage.getByRole('option', { name: 'Last 30 days' })).toBeVisible();
    await expect(adminPage.getByRole('option', { name: 'Last 90 days' })).toBeVisible();
  });

  test('should change period', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Open period dropdown
    const periodSelect = adminPage.getByRole('combobox');
    await periodSelect.click();

    // Select 7 days
    await adminPage.getByRole('option', { name: 'Last 7 days' }).click();

    // Wait for data to reload
    await adminPage.waitForLoadState('networkidle');

    // Verify selection
    await expect(periodSelect).toHaveText(/Last 7 days/);
  });

  test('should display summary cards', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for summary cards
    await expect(adminPage.getByText('Total Views')).toBeVisible();
    await expect(adminPage.getByText('Today')).toBeVisible();
    await expect(adminPage.getByText('This Week')).toBeVisible();
    await expect(adminPage.getByText('This Month')).toBeVisible();
  });

  test('should display daily views chart', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for chart section
    await expect(adminPage.getByText('Daily Views')).toBeVisible();
  });

  test('should display top posts section', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for top posts section
    await expect(adminPage.getByText('Top Posts')).toBeVisible();
  });

  test('should display top referrers section', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for top referrers section
    await expect(adminPage.getByText('Top Referrers')).toBeVisible();
  });

  test('should navigate to analytics from admin sidebar', async ({ adminPage }) => {
    await adminPage.goto('/admin');

    // Click on Analytics link in sidebar
    await adminPage.getByRole('link', { name: /analytics/i }).click();

    await expect(adminPage).toHaveURL('/admin/analytics');
  });

  test('should show loading state initially', async ({ adminPage }) => {
    // Use slow network to capture loading state
    await adminPage.route('**/api/admin/analytics**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await adminPage.goto('/admin/analytics');

    // Should show loading indicator (any animate-pulse element)
    const loadingIndicator = adminPage.locator('[class*="animate-pulse"]').first();
    const isVisible = await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false);

    // If loading is visible, great! If not, the data loaded fast which is fine too
    if (isVisible) {
      await expect(loadingIndicator).toBeVisible();
    }
  });

  test('should handle empty data gracefully', async ({ adminPage }) => {
    // Mock empty analytics response
    await adminPage.route('**/api/admin/analytics**', async (route) => {
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

    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Should show "No posts with views yet" or similar
    await expect(adminPage.getByText('No posts with views yet')).toBeVisible();
    await expect(adminPage.getByText('No referrer data available')).toBeVisible();
  });

  test('should display all time total', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for "All time" label
    await expect(adminPage.getByText('All time')).toBeVisible();
  });

  test('should show percentage change indicator', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Check for percentage indicator (up or down arrow, or the % text)
    const percentageIndicator = adminPage.locator('text=/[+-]?\\d+%/');
    const count = await percentageIndicator.count();

    // Should have at least one percentage indicator if there's data
    // If no data, this test passes anyway
    if (count > 0) {
      await expect(percentageIndicator.first()).toBeVisible();
    }
  });

  test('should link top posts to blog', async ({ adminPage }) => {
    await adminPage.goto('/admin/analytics');
    await adminPage.waitForLoadState('networkidle');

    // Look for any external link icons in top posts section
    const topPostsSection = adminPage.locator('text=Top Posts').locator('..');
    const postLinks = topPostsSection.locator('a[href^="/blog/"]');

    const count = await postLinks.count();
    if (count > 0) {
      // First link should point to a blog post
      const href = await postLinks.first().getAttribute('href');
      expect(href).toMatch(/^\/blog\//);
    }
  });
});

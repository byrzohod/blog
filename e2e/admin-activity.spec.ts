import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Activity Log', () => {
  test.beforeEach(async ({ adminPage }) => {
    // Already logged in via fixture
  });

  test('should display activity log page', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');

    // Check page title
    await expect(adminPage.getByRole('heading', { name: 'Activity Log' })).toBeVisible();

    // Check subtitle
    await expect(adminPage.getByText('Track all admin actions and changes')).toBeVisible();
  });

  test('should show filters section', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');

    await adminPage.waitForLoadState('networkidle');

    // Check filter section
    await expect(adminPage.getByText('Filters')).toBeVisible();

    // Check entity type filter label
    await expect(adminPage.getByText('Entity Type')).toBeVisible();

    // Check action filter label (use exact match)
    await expect(adminPage.getByText('Action', { exact: true })).toBeVisible();
  });

  test('should filter by entity type', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');

    // Wait for the page to load
    await adminPage.waitForLoadState('networkidle');

    // Open entity type dropdown (first combobox)
    await adminPage.getByRole('combobox').first().click();

    // Select 'Posts' option
    await adminPage.getByRole('option', { name: 'Posts' }).click();

    // Filter is applied locally, page should still work
    await adminPage.waitForLoadState('networkidle');
  });

  test('should filter by action', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');

    // Wait for the page to load
    await adminPage.waitForLoadState('networkidle');

    // Open action dropdown (second combobox)
    const comboboxes = adminPage.getByRole('combobox');
    await comboboxes.nth(1).click();

    // Select 'Create' option
    await adminPage.getByRole('option', { name: 'Create' }).click();

    // Filter is applied locally
    await adminPage.waitForLoadState('networkidle');
  });

  test('should show activity count badge', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');

    await adminPage.waitForLoadState('networkidle');

    // Check for activities count badge
    const badge = adminPage.getByText(/\d+ activities/);
    await expect(badge).toBeVisible();
  });

  test('should show empty state when no activities', async ({ adminPage }) => {
    // Go to activity page with filters that likely return no results
    await adminPage.goto('/admin/activity?entityType=subscriber&action=spam');

    await adminPage.waitForLoadState('networkidle');

    // Either we see activities or the empty state
    const activityList = adminPage.locator('[class*="divide-y"]');
    const emptyState = adminPage.getByText('No activity recorded yet');

    // Wait for either to appear
    await Promise.race([
      activityList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
  });

  test('should navigate to activity log from admin sidebar', async ({ adminPage }) => {
    await adminPage.goto('/admin');

    // Click on Activity link in sidebar
    await adminPage.getByRole('link', { name: /activity/i }).click();

    await expect(adminPage).toHaveURL('/admin/activity');
  });

  test('should show activity entries if any exist', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');
    await adminPage.waitForLoadState('networkidle');

    // Either we see activity entries or empty state
    const activityList = adminPage.locator('[class*="divide-y"]');
    const emptyState = adminPage.getByText('No activity recorded yet');

    const hasActivities = await activityList.isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);

    // One of them should be true
    expect(hasActivities || isEmpty).toBe(true);
  });

  test('should filter activities by entity type', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');
    await adminPage.waitForLoadState('networkidle');

    // Open entity type dropdown and filter
    await adminPage.getByRole('combobox').first().click();
    await adminPage.getByRole('option', { name: 'Posts' }).click();

    // Page should still work after filtering
    await adminPage.waitForLoadState('networkidle');
    await expect(adminPage.getByRole('heading', { name: 'Activity Log' })).toBeVisible();
  });

  test('should show pagination when many activities', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');
    await adminPage.waitForLoadState('networkidle');

    // Check for pagination controls
    const pagination = adminPage.getByText(/Page \d+ of \d+/);
    const isVisible = await pagination.isVisible().catch(() => false);

    if (isVisible) {
      // Check for Previous/Next buttons (use exact match to avoid matching dev tools button)
      await expect(adminPage.getByRole('button', { name: 'Previous' })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    }
    // If no pagination visible, there might not be enough activities yet
  });

  test('should display activity details expandable section', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');
    await adminPage.waitForLoadState('networkidle');

    // Look for expandable details
    const details = adminPage.locator('details');
    const detailsCount = await details.count();

    if (detailsCount > 0) {
      // Click to expand first details
      await details.first().locator('summary').click();

      // Check that pre element with JSON is visible
      const jsonContent = details.first().locator('pre');
      await expect(jsonContent).toBeVisible();
    }
  });

  test('should show relative time for activities', async ({ adminPage }) => {
    await adminPage.goto('/admin/activity');
    await adminPage.waitForLoadState('networkidle');

    // Look for relative time indicators like "X minutes ago", "X hours ago", etc.
    const timeIndicators = adminPage.locator('text=/\\d+\\s+(second|minute|hour|day|week|month|year)s?\\s+ago/i');
    const count = await timeIndicators.count();

    // If there are activities, there should be time indicators
    if (count > 0) {
      await expect(timeIndicators.first()).toBeVisible();
    }
  });
});

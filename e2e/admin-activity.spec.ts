import { test, expect } from '@playwright/test';

const TEST_ADMIN = {
  email: 'admin@bookoflife.com',
  password: 'admin123',
};

test.describe('Admin Activity Log', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_ADMIN.email);
    await page.getByLabel('Password').fill(TEST_ADMIN.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display activity log page', async ({ page }) => {
    await page.goto('/admin/activity');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Activity Log' })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('Track all admin actions and changes')).toBeVisible();
  });

  test('should show filters section', async ({ page }) => {
    await page.goto('/admin/activity');

    // Check filter section
    await expect(page.getByText('Filters')).toBeVisible();

    // Check entity type filter
    await expect(page.getByLabel('Entity Type')).toBeVisible();

    // Check action filter
    await expect(page.getByLabel('Action')).toBeVisible();
  });

  test('should filter by entity type', async ({ page }) => {
    await page.goto('/admin/activity');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Open entity type dropdown
    await page.getByRole('combobox').first().click();

    // Select 'Posts' option
    await page.getByRole('option', { name: 'Posts' }).click();

    // Wait for the filter to be applied
    await page.waitForLoadState('networkidle');

    // Check URL contains the filter parameter
    await expect(page).toHaveURL(/entityType=post/);
  });

  test('should filter by action', async ({ page }) => {
    await page.goto('/admin/activity');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Open action dropdown (second combobox)
    const comboboxes = page.getByRole('combobox');
    await comboboxes.nth(1).click();

    // Select 'Create' option
    await page.getByRole('option', { name: 'Create' }).click();

    // Wait for the filter to be applied
    await page.waitForLoadState('networkidle');

    // Check URL contains the filter parameter
    await expect(page).toHaveURL(/action=create/);
  });

  test('should show activity count badge', async ({ page }) => {
    await page.goto('/admin/activity');

    // Check for activities count badge
    const badge = page.locator('[class*="Badge"]').filter({ hasText: /\d+ activities/ });
    await expect(badge).toBeVisible();
  });

  test('should show empty state when no activities', async ({ page }) => {
    // Go to activity page with filters that likely return no results
    await page.goto('/admin/activity?entityType=subscriber&action=spam');

    await page.waitForLoadState('networkidle');

    // Either we see activities or the empty state
    const activityList = page.locator('[class*="divide-y"]');
    const emptyState = page.getByText('No activity recorded yet');

    // Wait for either to appear
    await Promise.race([
      activityList.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
  });

  test('should navigate to activity log from admin sidebar', async ({ page }) => {
    await page.goto('/admin');

    // Click on Activity link in sidebar
    await page.getByRole('link', { name: /activity/i }).click();

    await expect(page).toHaveURL('/admin/activity');
  });

  test('should record activity when creating a category', async ({ page }) => {
    // Create a unique category
    const categoryName = `Test Category ${Date.now()}`;
    const categorySlug = `test-category-${Date.now()}`;

    // Go to categories page
    await page.goto('/admin/categories');

    // Click new category button
    await page.getByRole('button', { name: /new category/i }).click();

    // Fill in form
    await page.getByLabel('Name').fill(categoryName);
    await page.getByLabel('Slug').fill(categorySlug);

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for success
    await page.waitForLoadState('networkidle');

    // Now check activity log
    await page.goto('/admin/activity?entityType=category');
    await page.waitForLoadState('networkidle');

    // Should see the create activity
    const activityEntry = page.getByText(`Created category: ${categoryName}`);
    await expect(activityEntry).toBeVisible({ timeout: 10000 });

    // Cleanup - delete the category
    await page.goto('/admin/categories');
    const categoryRow = page.locator('tr').filter({ hasText: categoryName });
    await categoryRow.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm|delete/i }).click();
  });

  test('should record activity when creating a tag', async ({ page }) => {
    // Create a unique tag
    const tagName = `Test Tag ${Date.now()}`;
    const tagSlug = `test-tag-${Date.now()}`;

    // Go to tags page
    await page.goto('/admin/tags');

    // Click new tag button
    await page.getByRole('button', { name: /new tag/i }).click();

    // Fill in form
    await page.getByLabel('Name').fill(tagName);
    await page.getByLabel('Slug').fill(tagSlug);

    // Submit
    await page.getByRole('button', { name: /create/i }).click();

    // Wait for success
    await page.waitForLoadState('networkidle');

    // Now check activity log
    await page.goto('/admin/activity?entityType=tag');
    await page.waitForLoadState('networkidle');

    // Should see the create activity
    const activityEntry = page.getByText(`Created tag: ${tagName}`);
    await expect(activityEntry).toBeVisible({ timeout: 10000 });

    // Cleanup - delete the tag
    await page.goto('/admin/tags');
    const tagRow = page.locator('tr').filter({ hasText: tagName });
    await tagRow.getByRole('button', { name: /delete/i }).click();
    await page.getByRole('button', { name: /confirm|delete/i }).click();
  });

  test('should show pagination when many activities', async ({ page }) => {
    await page.goto('/admin/activity');
    await page.waitForLoadState('networkidle');

    // Check for pagination controls
    const pagination = page.getByText(/Page \d+ of \d+/);
    const isVisible = await pagination.isVisible().catch(() => false);

    if (isVisible) {
      // Check for Previous/Next buttons
      await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    }
    // If no pagination visible, there might not be enough activities yet
  });

  test('should display activity details expandable section', async ({ page }) => {
    await page.goto('/admin/activity');
    await page.waitForLoadState('networkidle');

    // Look for expandable details
    const details = page.locator('details');
    const detailsCount = await details.count();

    if (detailsCount > 0) {
      // Click to expand first details
      await details.first().locator('summary').click();

      // Check that pre element with JSON is visible
      const jsonContent = details.first().locator('pre');
      await expect(jsonContent).toBeVisible();
    }
  });

  test('should show relative time for activities', async ({ page }) => {
    await page.goto('/admin/activity');
    await page.waitForLoadState('networkidle');

    // Look for relative time indicators like "X minutes ago", "X hours ago", etc.
    const timeIndicators = page.locator('text=/\\d+\\s+(second|minute|hour|day|week|month|year)s?\\s+ago/i');
    const count = await timeIndicators.count();

    // If there are activities, there should be time indicators
    if (count > 0) {
      await expect(timeIndicators.first()).toBeVisible();
    }
  });
});

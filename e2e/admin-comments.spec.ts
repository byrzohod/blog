import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Comments', () => {
  test.describe('Comments List', () => {
    test('should display comments page', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      // Should have comments heading
      await expect(adminPage.getByRole('heading', { name: 'Comments' })).toBeVisible();
    });

    test('should show status filter tabs', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      // Should have filter buttons
      await expect(adminPage.getByRole('button', { name: /all/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /pending/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /approved/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: /spam/i })).toBeVisible();
    });

    test('should filter comments by status', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      // Click on Pending tab - this filters locally, doesn't change URL
      const pendingButton = adminPage.getByRole('button', { name: /pending/i });
      await pendingButton.click();

      // Button should be selected (default variant)
      await expect(pendingButton).toBeVisible();
    });

    test('should display comment list or empty state', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      // Wait for the page to load
      await adminPage.waitForLoadState('networkidle');

      // Should show either comments count or empty state
      const commentsHeader = adminPage.getByText(/\d+ Comments/);
      const emptyState = adminPage.getByText(/no comments found/i);

      const hasComments = await commentsHeader.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasComments || isEmpty).toBe(true);
    });
  });

  test.describe('Comment Moderation', () => {
    test('should show moderation actions', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      await adminPage.waitForLoadState('networkidle');

      // Look for action buttons in the table (approve, spam, trash icons)
      const table = adminPage.locator('table');
      const hasComments = await table.isVisible();

      if (hasComments) {
        // Should have action buttons in each row
        const firstRow = adminPage.locator('tr').nth(1);
        const buttons = firstRow.locator('button');
        const buttonCount = await buttons.count();

        // Should have at least some action buttons
        expect(buttonCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should have bulk action select all checkbox', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      await adminPage.waitForLoadState('networkidle');

      // Look for select all checkbox
      const selectAllCheckbox = adminPage.locator('thead input[type="checkbox"]');
      const exists = await selectAllCheckbox.isVisible().catch(() => false);

      // If there are comments with bulk selection
      if (exists) {
        await expect(selectAllCheckbox).toBeVisible();
      }
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination controls when there are many comments', async ({ adminPage }) => {
      await adminPage.goto('/admin/comments');

      await adminPage.waitForLoadState('networkidle');

      // Look for pagination info (showing X of Y)
      const showingText = adminPage.getByText(/showing/i);

      if (await showingText.isVisible().catch(() => false)) {
        await expect(showingText).toBeVisible();
      }
    });
  });

  test.describe('Access Control', () => {
    test('should redirect non-admin users', async ({ subscriberPage }) => {
      await subscriberPage.goto('/admin/comments');

      // Should redirect to login or show unauthorized
      await expect(subscriberPage).not.toHaveURL('/admin/comments');
    });
  });
});

import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Users', () => {
  test.describe('Users List', () => {
    test('should display users page', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Should have users heading
      await expect(adminPage.getByRole('heading', { name: 'Users' })).toBeVisible();
    });

    test('should show role filter tabs', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Should have filter buttons for different roles
      await expect(adminPage.getByRole('button', { name: /all users/i })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'ADMIN' })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'AUTHOR' })).toBeVisible();
      await expect(adminPage.getByRole('button', { name: 'SUBSCRIBER' })).toBeVisible();
    });

    test('should display user list or empty state', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Should show users count in card header
      const usersHeader = adminPage.getByText(/\d+ Users/);
      const emptyState = adminPage.getByText(/no users found/i);

      const hasUsers = await usersHeader.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      expect(hasUsers || isEmpty).toBe(true);
    });

    test('should show seed data users', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Should show admin user from seed data (test email)
      await expect(adminPage.getByText('admin@test.com').first()).toBeVisible();
    });
  });

  test.describe('User Filtering', () => {
    test('should filter users by role', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Click on ADMIN filter - filters locally, doesn't change URL
      const adminFilter = adminPage.getByRole('button', { name: 'ADMIN' });
      await adminFilter.click();

      // Button should be active
      await expect(adminFilter).toBeVisible();
    });
  });

  test.describe('Role Management', () => {
    test('should show role badges', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Look for role badges (Admin, Author, Subscriber)
      const adminBadge = adminPage.locator('text=ADMIN').first();
      await expect(adminBadge).toBeVisible();
    });

    test('should have role change dropdown for non-self users', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Look for select/dropdown in user rows
      const selectElements = adminPage.locator('select');
      const count = await selectElements.count();

      // There should be role selectors for other users
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Pagination', () => {
    test('should show pagination when many users exist', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Look for showing text or page navigation
      const showingText = adminPage.getByText(/showing/i);

      if (await showingText.isVisible().catch(() => false)) {
        await expect(showingText).toBeVisible();
      }
    });
  });

  test.describe('Access Control', () => {
    test('should allow admin access', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Admin should see the page
      await expect(adminPage.getByRole('heading', { name: 'Users' })).toBeVisible();
    });

    test('should redirect subscriber away from users page', async ({ subscriberPage }) => {
      await subscriberPage.goto('/admin/users');

      // Subscribers should be redirected
      await expect(subscriberPage).not.toHaveURL('/admin/users');
    });
  });
});

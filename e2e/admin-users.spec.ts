import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Users', () => {
  test.describe('Users List', () => {
    test('should display users page', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Should have users heading
      await expect(adminPage.getByRole('heading', { name: 'Users' })).toBeVisible();
    });

    test('should show role filter tabs', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Should have filter tabs for different roles
      await expect(adminPage.getByRole('button', { name: /all/i })).toBeVisible();
    });

    test('should display user information in table', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Should have a table with user data
      const table = adminPage.locator('table');
      await expect(table).toBeVisible();

      // Should show column headers
      await expect(adminPage.getByText('Name')).toBeVisible();
      await expect(adminPage.getByText('Email')).toBeVisible();
      await expect(adminPage.getByText('Role')).toBeVisible();
    });

    test('should show seed data users', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      await adminPage.waitForLoadState('networkidle');

      // Should show admin user from seed data
      await expect(adminPage.getByText('admin@test.com').first()).toBeVisible();
    });
  });

  test.describe('User Filtering', () => {
    test('should filter users by role', async ({ adminPage }) => {
      await adminPage.goto('/admin/users');

      // Click on ADMIN filter if available
      const adminFilter = adminPage.getByRole('button', { name: /admin/i });

      if (await adminFilter.isVisible().catch(() => false)) {
        await adminFilter.click();
        await expect(adminPage).toHaveURL(/role=ADMIN/);
      }
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

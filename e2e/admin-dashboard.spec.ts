import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Dashboard', () => {
  test.describe('Dashboard Overview', () => {
    test('should display dashboard with stats', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should have dashboard heading
      await expect(adminPage.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();

      // Should have stats cards (use first() to handle multiple matches)
      await expect(adminPage.getByText('Total Posts').first()).toBeVisible();
      await expect(adminPage.getByText('Comments').first()).toBeVisible();
      await expect(adminPage.getByText('Subscribers').first()).toBeVisible();
    });

    test('should display post count', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should show posts count in the Total Posts card
      const postsCard = adminPage.locator('.text-2xl.font-bold').first();
      await expect(postsCard).toBeVisible();
    });

    test('should display recent posts section', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should show recent posts card
      await expect(adminPage.getByText('Recent Posts')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to posts page', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Click posts link in sidebar
      await adminPage.getByRole('link', { name: 'Posts', exact: true }).click();

      await expect(adminPage).toHaveURL('/admin/posts');
    });

    test('should navigate via New Post button', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Click New Post button
      await adminPage.getByRole('link', { name: /new post/i }).click();

      await expect(adminPage).toHaveURL('/admin/posts/new');
    });

    test('should navigate to comments page', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Click comments link in sidebar
      await adminPage.getByRole('link', { name: 'Comments', exact: true }).click();

      await expect(adminPage).toHaveURL('/admin/comments');
    });

    test('should have link to view site', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should have View Site link in Quick Actions
      const viewSiteLink = adminPage.getByRole('link', { name: 'View Site' });
      await expect(viewSiteLink).toBeVisible();
    });
  });

  test.describe('User Info', () => {
    test('should display logged in user name', async ({ adminPage }) => {
      await adminPage.goto('/admin');

      // Should show admin user name somewhere (dashboard welcome message or sidebar)
      await expect(adminPage.getByText('Test Admin').first()).toBeVisible();
    });
  });
});

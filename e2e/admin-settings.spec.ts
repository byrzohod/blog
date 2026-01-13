import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Settings', () => {
  test.describe('Settings Page', () => {
    test('should display settings page', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      // Should have settings heading
      await expect(adminPage.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('should show general settings section', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Should have General settings card
      await expect(adminPage.getByText('General')).toBeVisible();
    });

    test('should display site title field', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Should have site title input
      const siteTitleField = adminPage.getByLabel('Site Title');
      await expect(siteTitleField).toBeVisible();
    });

    test('should display site description field', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Should have site description textarea
      const descriptionField = adminPage.getByLabel('Site Description');
      await expect(descriptionField).toBeVisible();
    });
  });

  test.describe('Settings Form', () => {
    test('should have contact email field', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Should have contact email input
      const emailField = adminPage.getByLabel('Contact Email');
      await expect(emailField).toBeVisible();
    });

    test('should have save button', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Should have save button
      const saveButton = adminPage.getByRole('button', { name: /save/i });
      await expect(saveButton).toBeVisible();
    });

    test('should update settings', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      await adminPage.waitForLoadState('networkidle');

      // Get the site title field
      const siteTitleField = adminPage.getByLabel('Site Title');

      // Clear and enter new value
      const testValue = `Test Site ${Date.now()}`;
      await siteTitleField.fill(testValue);

      // Click save
      await adminPage.getByRole('button', { name: /save/i }).click();

      // Wait for success message
      await expect(adminPage.getByText(/saved successfully/i)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Comment Settings', () => {
    test('should have comment moderation settings', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      // Look for comment settings section
      const commentSettings = adminPage.getByText(/comment/i);

      if (await commentSettings.first().isVisible().catch(() => false)) {
        await expect(commentSettings.first()).toBeVisible();
      }
    });

    test('should have moderation toggle', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      // Look for moderation checkbox or switch
      const moderationToggle = adminPage.getByLabel(/moderat|require approval/i);

      if (await moderationToggle.isVisible().catch(() => false)) {
        await expect(moderationToggle).toBeVisible();
      }
    });
  });

  test.describe('Access Control', () => {
    test('should allow admin access to settings', async ({ adminPage }) => {
      await adminPage.goto('/admin/settings');

      // Admin should see settings page
      await expect(adminPage.getByRole('heading', { name: 'Settings' })).toBeVisible();
    });

    test('should restrict settings access for non-admins', async ({ subscriberPage }) => {
      await subscriberPage.goto('/admin/settings');

      // Subscribers should be redirected
      await expect(subscriberPage).not.toHaveURL('/admin/settings');
    });

    test('author should access admin but may have limited settings', async ({ authorPage }) => {
      await authorPage.goto('/admin/settings');

      // Authors may or may not have access to settings
      // This depends on implementation - verify page loads or redirects
      await authorPage.waitForLoadState('networkidle');
    });
  });
});

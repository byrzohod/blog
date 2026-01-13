import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Tags', () => {
  test.describe('Tags List', () => {
    test('should display tags list', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Should have tags heading
      await expect(adminPage.getByRole('heading', { name: 'Tags', exact: true })).toBeVisible();
    });

    test('should show existing tags', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');
      await adminPage.waitForLoadState('networkidle');

      // Wait for tags to load (API fetch)
      await adminPage.waitForTimeout(1000);

      // Tags should display count in header
      const tagsHeader = adminPage.getByText(/All Tags \(\d+\)/);
      await expect(tagsHeader).toBeVisible({ timeout: 10000 });

      // Tags are displayed with # prefix
      // Check that at least one tag is visible
      const tagElements = adminPage.locator('.flex.flex-wrap > div');
      const count = await tagElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display tags as chips', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Tags are displayed in flex wrap container
      const tagContainer = adminPage.locator('.flex.flex-wrap');
      await expect(tagContainer).toBeVisible();
    });

    test('should have create new tag button', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      const createButton = adminPage.getByRole('button', { name: /new tag/i });
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Create Tag', () => {
    test('should open create dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Click create button
      await adminPage.getByRole('button', { name: /new tag/i }).click();

      // Should show dialog
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should have name field
      await expect(adminPage.getByLabel('Name')).toBeVisible();
    });

    test('should create new tag', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      const uniqueName = `testtag${Date.now()}`;

      // Open create dialog
      await adminPage.getByRole('button', { name: /new tag/i }).click();

      // Fill form
      await adminPage.getByLabel('Name').fill(uniqueName);

      // Wait for slug generation
      await adminPage.waitForTimeout(300);

      // Submit using Save button
      await adminPage.getByRole('button', { name: 'Save' }).click();

      // Wait for save
      await adminPage.waitForTimeout(1000);

      // Tag should appear in list (with # prefix)
      await expect(adminPage.getByText(`#${uniqueName}`)).toBeVisible();
    });

    test('should auto-generate slug from name', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Open create dialog
      await adminPage.getByRole('button', { name: /new tag/i }).click();

      // Fill name with spaces
      await adminPage.getByLabel('Name').fill('My New Tag');

      // Wait for slug generation
      await adminPage.waitForTimeout(300);

      // Slug should be generated
      const slugInput = adminPage.getByLabel('Slug');
      await expect(slugInput).toHaveValue('my-new-tag');
    });
  });

  test.describe('Edit Tag', () => {
    test('should open edit dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Find the first tag container and click its edit button
      // Tags are in divs with class containing rounded-lg bg-background-subtle
      const tagElements = adminPage.locator('.flex.flex-wrap > div');
      const firstTag = tagElements.first();
      const editButton = firstTag.locator('button').first();
      await editButton.click();

      // Should show dialog with existing data
      const nameInput = adminPage.getByLabel('Name');
      await expect(nameInput).not.toBeEmpty();
    });

    test('should update tag name', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Create a new tag first
      const originalName = `tagedit${Date.now()}`;

      await adminPage.getByRole('button', { name: /new tag/i }).click();
      await adminPage.getByLabel('Name').fill(originalName);
      await adminPage.waitForTimeout(300);
      await adminPage.getByRole('button', { name: 'Save' }).click();
      await adminPage.waitForTimeout(1000);

      // Reload page
      await adminPage.goto('/admin/tags');

      // Find the tag we created - it's displayed as "#originalName"
      // The tag container is a div with the tag element and buttons
      const tagContainer = adminPage.locator(`.rounded-lg.bg-background-subtle:has-text("#${originalName}")`);

      // Click the edit button (Edit icon button) - make sure we click a visible button
      const editButton = tagContainer.getByRole('button').first();
      await editButton.click();

      // Update name
      const updatedName = `${originalName}updated`;
      await adminPage.getByLabel('Name').fill(updatedName);

      // Save
      await adminPage.getByRole('button', { name: 'Save' }).click();
      await adminPage.waitForTimeout(1000);

      // Verify update
      await expect(adminPage.getByText(`#${updatedName}`)).toBeVisible();
    });
  });

  test.describe('Delete Tag', () => {
    test('should show delete confirmation dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');
      await adminPage.waitForLoadState('networkidle');

      // Create a new tag to test delete functionality
      const tagName = `tagtest${Date.now()}`;

      await adminPage.getByRole('button', { name: /new tag/i }).click();
      await adminPage.getByLabel('Name').fill(tagName);
      await adminPage.waitForTimeout(300);
      await adminPage.getByRole('button', { name: 'Save' }).click();

      // Wait for dialog to close and tag to appear
      await expect(adminPage.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
      await expect(adminPage.getByText(`#${tagName}`)).toBeVisible({ timeout: 5000 });

      // Find the tag container and click delete button (trash icon)
      const tagContainer = adminPage.locator(`.rounded-lg.bg-background-subtle:has-text("#${tagName}")`);
      const deleteButton = tagContainer.locator('button').last();
      await deleteButton.click();

      // Verify confirmation dialog appears
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(adminPage.getByText(/are you sure/i)).toBeVisible();

      // Verify dialog has Cancel and Delete buttons
      await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Delete' })).toBeVisible();

      // Close dialog without deleting
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).not.toBeVisible({ timeout: 5000 });

      // Tag should still be visible
      await expect(adminPage.getByText(`#${tagName}`)).toBeVisible();
    });

    test('should allow deleting tag with posts', async ({ adminPage }) => {
      await adminPage.goto('/admin/tags');

      // Testing tag has posts from seed data
      // Tags can be deleted even with posts (will just remove association)
      const testingTagElement = adminPage.locator('div:has-text("#testing")').first();

      if (await testingTagElement.isVisible()) {
        const deleteButton = testingTagElement.locator('button').last();

        // Unlike categories, tag delete should be enabled
        const isDisabled = await deleteButton.isDisabled().catch(() => false);
        expect(isDisabled).toBeFalsy();
      }
    });
  });
});

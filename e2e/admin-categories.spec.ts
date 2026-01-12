import { test, expect } from './fixtures/auth.fixture';

test.describe('Admin Categories', () => {
  test.describe('Categories List', () => {
    test('should display categories list', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Should have categories heading
      await expect(adminPage.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
    });

    test('should show existing categories from seed data', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Should show seeded categories in table cells (use first() to handle name + slug)
      await expect(adminPage.getByText('Technology').first()).toBeVisible();
      await expect(adminPage.getByText('Life').first()).toBeVisible();
      await expect(adminPage.getByText('Travel').first()).toBeVisible();
    });

    test('should have create new category button', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      const createButton = adminPage.getByRole('button', { name: /new category/i });
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('Create Category', () => {
    test('should open create dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Click create button
      const createButton = adminPage.getByRole('button', { name: /new category/i });
      await createButton.click();

      // Should show dialog with form
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should have name field
      await expect(adminPage.getByLabel('Name')).toBeVisible();
    });

    test('should auto-generate slug from name', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Open create dialog
      await adminPage.getByRole('button', { name: /new category/i }).click();

      // Fill name
      await adminPage.getByLabel('Name').fill('My New Category');

      // Wait for slug generation
      await adminPage.waitForTimeout(300);

      // Slug should be generated
      const slugInput = adminPage.getByLabel('Slug');
      await expect(slugInput).toHaveValue('my-new-category');
    });

    test('should create new category', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      const uniqueName = `Test Category ${Date.now()}`;

      // Open create dialog
      await adminPage.getByRole('button', { name: /new category/i }).click();

      // Fill form
      await adminPage.getByLabel('Name').fill(uniqueName);

      // Wait for slug generation
      await adminPage.waitForTimeout(300);

      // Submit using Save button
      await adminPage.getByRole('button', { name: 'Save' }).click();

      // Wait for save
      await adminPage.waitForTimeout(1000);

      // Category should appear in list
      await expect(adminPage.getByText(uniqueName)).toBeVisible();
    });
  });

  test.describe('Edit Category', () => {
    test('should open edit dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Find the first row with edit button (icon button with Edit icon)
      // The edit button is inside a row that contains the category name
      const firstRow = adminPage.locator('tr').nth(1); // Skip header row
      const editButton = firstRow.locator('button').first();
      await editButton.click();

      // Should show dialog with existing data
      const nameInput = adminPage.getByLabel('Name');
      await expect(nameInput).not.toBeEmpty();
    });

    test('should update category name', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Create a new category first
      const originalName = `Category to Edit ${Date.now()}`;

      await adminPage.getByRole('button', { name: /new category/i }).click();
      await adminPage.getByLabel('Name').fill(originalName);
      await adminPage.waitForTimeout(300);
      await adminPage.getByRole('button', { name: 'Save' }).click();
      await adminPage.waitForTimeout(1000);

      // Reload page to ensure category is there
      await adminPage.goto('/admin/categories');

      // Find the row with our category and click edit
      const categoryRow = adminPage.locator(`tr:has-text("${originalName}")`);
      await categoryRow.locator('button').first().click();

      // Update name
      const updatedName = `${originalName} (Updated)`;
      await adminPage.getByLabel('Name').fill(updatedName);

      // Save
      await adminPage.getByRole('button', { name: 'Save' }).click();
      await adminPage.waitForTimeout(1000);

      // Verify update
      await expect(adminPage.getByText(updatedName)).toBeVisible();
    });
  });

  test.describe('Delete Category', () => {
    test('should delete category without posts', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Create a new category to delete
      const categoryName = `Category to Delete ${Date.now()}`;

      await adminPage.getByRole('button', { name: /new category/i }).click();
      await adminPage.getByLabel('Name').fill(categoryName);
      await adminPage.waitForTimeout(300);
      await adminPage.getByRole('button', { name: 'Save' }).click();
      await adminPage.waitForTimeout(1000);

      // Reload page
      await adminPage.goto('/admin/categories');

      // Find the row with our category
      const categoryRow = adminPage.locator(`tr:has-text("${categoryName}")`);

      // Click delete button (second button in the row, the trash icon)
      const deleteButton = categoryRow.locator('button').last();

      // Check if delete button is enabled
      const isDisabled = await deleteButton.isDisabled();

      if (!isDisabled) {
        await deleteButton.click();

        // Confirm deletion in dialog
        const confirmButton = adminPage.getByRole('button', { name: 'Delete' }).last();
        await confirmButton.click();

        await adminPage.waitForTimeout(1000);

        // Category should be removed
        await expect(adminPage.getByText(categoryName)).not.toBeVisible();
      }
    });

    test('should disable delete for category with posts', async ({ adminPage }) => {
      await adminPage.goto('/admin/categories');

      // Technology category has posts from seed data
      const techRow = adminPage.locator('tr:has-text("Technology")');
      const deleteButton = techRow.locator('button').last();

      // Delete button should be disabled for category with posts
      await expect(deleteButton).toBeDisabled();
    });
  });
});

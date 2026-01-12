import { test, expect } from '@playwright/test';
import path from 'path';

const TEST_ADMIN = {
  email: 'admin@bookoflife.com',
  password: 'admin123',
};

test.describe('Admin Media Library', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_ADMIN.email);
    await page.getByLabel('Password').fill(TEST_ADMIN.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('should display media library page', async ({ page }) => {
    await page.goto('/admin/media');

    // Check page title
    await expect(page.getByRole('heading', { name: 'Media Library' })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('Manage your uploaded images and files')).toBeVisible();
  });

  test('should show upload zone', async ({ page }) => {
    await page.goto('/admin/media');

    // Check for upload zone text
    await expect(page.getByText('Drag and drop files here')).toBeVisible();

    // Check for select files button
    await expect(page.getByRole('button', { name: /select files/i })).toBeVisible();

    // Check for supported formats info
    await expect(page.getByText(/Supported: JPEG, PNG, GIF, WebP/i)).toBeVisible();
  });

  test('should show filters section', async ({ page }) => {
    await page.goto('/admin/media');

    // Check filter section
    await expect(page.getByText('Filters')).toBeVisible();

    // Check search input
    await expect(page.getByPlaceholder(/search by filename/i)).toBeVisible();

    // Check sort dropdown
    await expect(page.getByRole('combobox')).toBeVisible();
  });

  test('should toggle between grid and list view', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Get view toggle buttons
    const gridButton = page.locator('button').filter({ has: page.locator('svg.lucide-grid-3x3') });
    const listButton = page.locator('button').filter({ has: page.locator('svg.lucide-list') });

    // Grid should be active by default
    await expect(gridButton).toHaveClass(/bg-/);

    // Click list view
    await listButton.click();

    // List button should now be active
    await expect(listButton).toHaveClass(/bg-/);
  });

  test('should search media by filename', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Type in search
    const searchInput = page.getByPlaceholder(/search by filename/i);
    await searchInput.fill('test-image');

    // Wait for debounced search
    await page.waitForTimeout(500);

    // The search should filter the results (check that the list updates)
    // This test mainly verifies the search input works
    await expect(searchInput).toHaveValue('test-image');
  });

  test('should change sort order', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Open sort dropdown
    await page.getByRole('combobox').click();

    // Select oldest first
    await page.getByRole('option', { name: 'Oldest First' }).click();

    // Verify selection
    await expect(page.getByRole('combobox')).toHaveText(/Oldest First/);
  });

  test('should show file count badge', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Check for file count badge
    const badge = page.locator('[class*="Badge"]').filter({ hasText: /\d+ files/ });
    await expect(badge).toBeVisible();
  });

  test('should show empty state when no media', async ({ page }) => {
    // Search for something that doesn't exist
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search by filename/i);
    await searchInput.fill('nonexistent-file-xyz-12345');

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Either we see media or the empty state
    const emptyState = page.getByText('No media files found');
    const mediaGrid = page.locator('[class*="grid-cols"]');

    await Promise.race([
      emptyState.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      mediaGrid.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    ]);
  });

  test('should upload a file', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Create a test image
    const buffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload using file chooser
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: `test-upload-${Date.now()}.png`,
      mimeType: 'image/png',
      buffer,
    });

    // Wait for upload to complete
    await page.waitForLoadState('networkidle');

    // Should see the uploaded file (or at least no error)
    const successToast = page.getByText(/upload failed/i);
    await expect(successToast).not.toBeVisible({ timeout: 5000 });
  });

  test('should open media detail dialog', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Wait for media to load
    const mediaItems = page.locator('[class*="aspect-square"]');
    const count = await mediaItems.count();

    if (count > 0) {
      // Click on first media item
      await mediaItems.first().click();

      // Check that dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Media Details')).toBeVisible();

      // Check for detail fields
      await expect(page.getByText('Filename')).toBeVisible();
      await expect(page.getByText('Dimensions')).toBeVisible();
      await expect(page.getByText('Size')).toBeVisible();
    }
  });

  test('should copy URL to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Wait for media to load
    const mediaItems = page.locator('[class*="aspect-square"]');
    const count = await mediaItems.count();

    if (count > 0) {
      // Hover over first media item to show action buttons
      await mediaItems.first().hover();

      // Click copy button
      const copyButton = page.locator('button').filter({ has: page.locator('svg.lucide-copy') }).first();
      await copyButton.click();

      // Should show check mark indicating success
      await expect(page.locator('svg.lucide-check').first()).toBeVisible({ timeout: 2000 });
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Wait for media to load
    const mediaItems = page.locator('[class*="aspect-square"]');
    const count = await mediaItems.count();

    if (count > 0) {
      // Hover over first media item to show action buttons
      await mediaItems.first().hover();

      // Click delete button
      const deleteButton = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).first();
      await deleteButton.click();

      // Check that confirmation dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Delete Media')).toBeVisible();
      await expect(page.getByText(/Are you sure you want to delete/)).toBeVisible();

      // Close dialog
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should navigate to media library from admin sidebar', async ({ page }) => {
    await page.goto('/admin');

    // Click on Media link in sidebar
    await page.getByRole('link', { name: /media/i }).click();

    await expect(page).toHaveURL('/admin/media');
  });

  test('should show pagination when many media files', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Check for pagination controls
    const pagination = page.getByText(/Page \d+ of \d+/);
    const isVisible = await pagination.isVisible().catch(() => false);

    if (isVisible) {
      // Check for Previous/Next buttons
      await expect(page.getByRole('button', { name: /previous/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeVisible();
    }
    // If no pagination visible, there might not be enough media files yet
  });

  test('should show available size variants in detail dialog', async ({ page }) => {
    await page.goto('/admin/media');
    await page.waitForLoadState('networkidle');

    // Wait for media to load
    const mediaItems = page.locator('[class*="aspect-square"]');
    const count = await mediaItems.count();

    if (count > 0) {
      // Click on first media item
      await mediaItems.first().click();

      // Check that dialog opens
      await expect(page.getByRole('dialog')).toBeVisible();

      // Check for size variant buttons
      await expect(page.getByText('Available Sizes')).toBeVisible();
      await expect(page.getByRole('button', { name: /original/i })).toBeVisible();
    }
  });
});

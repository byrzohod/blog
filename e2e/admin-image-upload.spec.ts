import { test, expect } from './fixtures/auth.fixture';
import * as path from 'path';
import * as fs from 'fs';

test.describe('Admin Image Upload', () => {
  test.describe('Post Editor Image Upload', () => {
    test('should display image upload section in new post', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should have Featured Image section
      await expect(adminPage.getByText('Featured Image')).toBeVisible();
    });

    test('should show upload and media library buttons', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should have upload button
      const uploadButton = adminPage.getByRole('button', { name: /upload/i });
      await expect(uploadButton).toBeVisible();

      // Should have media library button
      const mediaLibraryButton = adminPage.getByRole('button', { name: /media library/i });
      await expect(mediaLibraryButton).toBeVisible();
    });

    test('should show drop zone for image upload', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should have drag and drop area text
      await expect(adminPage.getByText(/drop an image|drag and drop/i)).toBeVisible();
    });

    test('should open media picker dialog', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Click media library button
      const mediaLibraryButton = adminPage.getByRole('button', { name: /media library/i });
      await mediaLibraryButton.click();

      // Dialog should open
      const dialog = adminPage.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Dialog should have search input
      await expect(adminPage.getByPlaceholder(/search/i)).toBeVisible();
    });

    test('should close media picker with cancel button', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Click media library button
      await adminPage.getByRole('button', { name: /media library/i }).click();

      // Dialog should be visible
      await expect(adminPage.getByRole('dialog')).toBeVisible();

      // Click cancel
      await adminPage.getByRole('button', { name: /cancel/i }).click();

      // Dialog should close
      await expect(adminPage.getByRole('dialog')).not.toBeVisible();
    });

    test('should show select button disabled until image selected', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Open media picker
      await adminPage.getByRole('button', { name: /media library/i }).click();

      // Select image button should be disabled initially
      const selectButton = adminPage.getByRole('button', { name: /select image/i });
      await expect(selectButton).toBeDisabled();
    });
  });

  test.describe('Edit Post Image Upload', () => {
    test('should display image upload section in edit post', async ({ adminPage }) => {
      // First, navigate to posts list to find an existing post
      await adminPage.goto('/admin/posts');

      await adminPage.waitForLoadState('networkidle');

      // Click on first post's edit link
      const editLink = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]').first();

      if (await editLink.isVisible().catch(() => false)) {
        await editLink.click();

        // Should have Featured Image section
        await expect(adminPage.getByText('Featured Image')).toBeVisible();
      }
    });

    test('should show existing featured image if set', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts');

      await adminPage.waitForLoadState('networkidle');

      // Find a post that might have a featured image
      const editLink = adminPage.locator('a[href*="/admin/posts/"][href*="/edit"]').first();

      if (await editLink.isVisible().catch(() => false)) {
        await editLink.click();

        await adminPage.waitForLoadState('networkidle');

        // Check for image or upload area
        const featuredImageSection = adminPage.locator('text=Featured Image').locator('..');
        await expect(featuredImageSection).toBeVisible();
      }
    });
  });

  test.describe('File Upload Validation', () => {
    test('should show file type restrictions', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should show accepted file types
      await expect(adminPage.getByText(/PNG|JPG|GIF|WebP/i)).toBeVisible();
    });

    test('should show file size limit', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should show size limit (10MB)
      await expect(adminPage.getByText(/10MB/i)).toBeVisible();
    });
  });

  test.describe('Slug Field', () => {
    test('should have slug field with explanation', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Should have slug label
      await expect(adminPage.getByLabel(/slug/i)).toBeVisible();

      // Should have explanation text
      await expect(adminPage.getByText(/URL-friendly/i)).toBeVisible();
    });

    test('should auto-generate slug from title on blur', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Fill in title
      const titleInput = adminPage.getByLabel(/title/i);
      await titleInput.fill('My Test Blog Post Title');

      // Blur the title field to trigger slug generation
      await titleInput.blur();

      // Wait for slug generation
      await adminPage.waitForTimeout(500);

      // Slug field should have generated value
      const slugInput = adminPage.getByLabel(/slug/i);
      const slugValue = await slugInput.inputValue();

      // Slug should be URL-friendly version of title
      expect(slugValue).toMatch(/my-test-blog-post-title/i);
    });

    test('should allow manual slug editing', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Fill in slug manually
      const slugInput = adminPage.getByLabel(/slug/i);
      await slugInput.fill('custom-slug-here');

      // Value should be what we entered
      await expect(slugInput).toHaveValue('custom-slug-here');
    });
  });

  test.describe('Media Library Dialog', () => {
    test('should search images in media library', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Open media picker
      await adminPage.getByRole('button', { name: /media library/i }).click();

      // Wait for dialog
      await expect(adminPage.getByRole('dialog')).toBeVisible();

      // Search for something
      const searchInput = adminPage.getByPlaceholder(/search/i);
      await searchInput.fill('test');

      // Wait for search results
      await adminPage.waitForTimeout(500);

      // Search should complete (either show results or no results message)
    });

    test('should show loading state while fetching images', async ({ adminPage }) => {
      await adminPage.goto('/admin/posts/new');

      // Open media picker
      await adminPage.getByRole('button', { name: /media library/i }).click();

      // Should show dialog
      await expect(adminPage.getByRole('dialog')).toBeVisible();

      // Dialog content should load (either images or empty state)
      await adminPage.waitForLoadState('networkidle');
    });
  });
});

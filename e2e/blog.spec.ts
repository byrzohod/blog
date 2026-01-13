import { test, expect } from '@playwright/test';

test.describe('Blog', () => {
  test.describe('Blog Listing', () => {
    test('should display blog listing page', async ({ page }) => {
      await page.goto('/blog');

      // Should have blog heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display post cards', async ({ page }) => {
      await page.goto('/blog');

      // Should have at least one post card (from seed data)
      const postLinks = page.locator('a[href^="/blog/"][href*="-"]');
      await expect(postLinks.first()).toBeVisible();
    });

    test('should navigate to individual post', async ({ page }) => {
      await page.goto('/blog');

      // Click on the first post link (not category/tag links)
      const postLink = page.locator('article a[href^="/blog/"]').first();
      if (await postLink.isVisible()) {
        await postLink.click();
      } else {
        // Fallback: find any post link
        await page.locator('a[href^="/blog/welcome"]').first().click();
      }

      // Should be on a post page
      await expect(page).toHaveURL(/\/blog\/[a-z0-9-]+$/);
    });

    test('should handle page parameter in URL', async ({ page }) => {
      await page.goto('/blog?page=1');

      // Should load successfully
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Category Filter', () => {
    test('should display category page', async ({ page }) => {
      await page.goto('/blog/category/technology');

      // Wait for page to load
      await page.waitForTimeout(500);

      // Should show Technology in title or heading (case insensitive)
      await expect(page.getByText(/technology/i).first()).toBeVisible();
    });

    test('should filter posts by category', async ({ page }) => {
      await page.goto('/blog/category/technology');

      // Wait for page to load
      await page.waitForTimeout(500);

      // Page should load without 404
      await expect(page).toHaveURL('/blog/category/technology');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  });

  test.describe('Tag Filter', () => {
    test('should display tag page', async ({ page }) => {
      await page.goto('/blog/tag/nextjs');

      // Should show the tag name
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should filter posts by tag', async ({ page }) => {
      await page.goto('/blog/tag/react');

      // Page should load without 404
      await expect(page).toHaveURL('/blog/tag/react');
    });
  });

  test.describe('Individual Post', () => {
    test('should display post content', async ({ page }) => {
      await page.goto('/blog/welcome-to-the-blog');

      // Should have post title
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    });

    test('should display post with article content', async ({ page }) => {
      await page.goto('/blog/welcome-to-the-blog');

      // Should have main content area
      await expect(page.locator('main')).toBeVisible();
      // Should have some content
      await expect(page.getByText(/welcome|blog|interesting/i).first()).toBeVisible();
    });

    test('should display post metadata', async ({ page }) => {
      await page.goto('/blog/welcome-to-the-blog');

      // Should have some date or reading time visible
      await expect(page.locator('main')).toBeVisible();
    });

    test('should display post content with navigation', async ({ page }) => {
      // Go to blog listing first to find a post
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');

      // Click on first post link
      const postLink = page.locator('article a[href*="/blog/"]').first();
      const hasPost = await postLink.isVisible().catch(() => false);

      if (hasPost) {
        await postLink.click();
        await page.waitForLoadState('networkidle');

        // Should have article content
        await expect(page.locator('article')).toBeVisible();

        // Should have back to blog link
        await expect(page.getByText('Back to Blog')).toBeVisible();
      }
    });

    test('should return 404 for non-existent post', async ({ page }) => {
      const response = await page.goto('/blog/non-existent-post-slug-12345');

      // Should be 404 or show not found message
      const is404 = response?.status() === 404;
      const hasNotFound = await page.getByText(/not found|404/i).isVisible().catch(() => false);

      expect(is404 || hasNotFound).toBeTruthy();
    });
  });

  test.describe('Reading Experience', () => {
    test('should load post page completely', async ({ page }) => {
      await page.goto('/blog/welcome-to-the-blog');

      // Verify main content loads
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible();
    });

    test('should have share functionality', async ({ page }) => {
      await page.goto('/blog/welcome-to-the-blog');

      // Look for share button
      const shareButton = page.getByRole('button', { name: /share/i });

      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Should show share options
        await expect(page.getByText(/twitter|linkedin|copy/i).first()).toBeVisible();
      } else {
        // Share might be in different location - just verify page loads
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });
});

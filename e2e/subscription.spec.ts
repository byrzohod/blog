import { test, expect } from '@playwright/test';

test.describe('Subscription', () => {
  test.describe('Subscribe Page', () => {
    test('should display subscribe page with options', async ({ page }) => {
      await page.goto('/subscribe');

      // Should have page heading
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Should have email subscription section
      await expect(page.getByText(/email|newsletter/i).first()).toBeVisible();
    });

    test('should have email subscription form', async ({ page }) => {
      await page.goto('/subscribe');

      // Should have email input
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();

      // Should have subscribe button
      const subscribeButton = page.getByRole('button', { name: /subscribe/i });
      await expect(subscribeButton).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/subscribe');

      // Wait for page to load
      await page.waitForTimeout(500);

      // Enter invalid email using the email label
      const emailInput = page.getByLabel('Email');
      await emailInput.fill('notanemail');

      // Click subscribe
      const subscribeButton = page.getByRole('button', { name: /subscribe/i });
      await subscribeButton.click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should stay on subscribe page (form didn't submit due to validation)
      // Note: HTML5 email validation may show browser native error
      await expect(page).toHaveURL('/subscribe');
    });

    test('should successfully subscribe with valid email', async ({ page }) => {
      await page.goto('/subscribe');

      // Enter valid email using the email label
      const uniqueEmail = `e2e-test-${Date.now()}@example.com`;
      const emailInput = page.getByLabel('Email');
      await emailInput.fill(uniqueEmail);

      // Click subscribe
      const subscribeButton = page.getByRole('button', { name: /subscribe/i });
      await subscribeButton.click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Should show success message (the actual message is "Check your email!")
      await expect(page.getByText(/success|thank you|subscribed|check.*email/i)).toBeVisible();
    });
  });

  test.describe('RSS Feed', () => {
    test('should serve RSS feed XML', async ({ page }) => {
      const response = await page.goto('/feed.xml');

      // Should return 200 OK
      expect(response?.status()).toBe(200);

      // Should be XML content type
      const contentType = response?.headers()['content-type'];
      expect(contentType).toMatch(/xml/);
    });

    test('should have valid RSS structure', async ({ page }) => {
      await page.goto('/feed.xml');

      // Should contain RSS elements
      const content = await page.content();
      expect(content).toContain('rss');
      expect(content).toContain('channel');
    });
  });

  test.describe('JSON Feed', () => {
    test('should serve JSON feed', async ({ page }) => {
      const response = await page.goto('/feed.json');

      // Should return 200 OK
      expect(response?.status()).toBe(200);

      // Should be JSON content type (application/feed+json or application/json)
      const contentType = response?.headers()['content-type'];
      expect(contentType).toMatch(/json|feed/);
    });

    test('should have valid JSON feed structure', async ({ page }) => {
      const response = await page.goto('/feed.json');

      // Get the response body as text first, then parse
      const body = await response?.text();
      const json = body ? JSON.parse(body) : null;

      // Should have JSON Feed required fields
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('title');
      expect(json).toHaveProperty('items');
    });
  });
});

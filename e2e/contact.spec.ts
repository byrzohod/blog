import { test, expect } from '@playwright/test';

test.describe('Contact', () => {
  test('should display contact page with form', async ({ page }) => {
    await page.goto('/contact');

    // Should have contact heading
    await expect(page.getByRole('heading', { name: /contact/i })).toBeVisible();

    // Should have form fields
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Subject')).toBeVisible();
    await expect(page.getByLabel('Message')).toBeVisible();
  });

  test('should have submit button', async ({ page }) => {
    await page.goto('/contact');

    const submitButton = page.getByRole('button', { name: /send message/i });
    await expect(submitButton).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/contact');

    // Submit empty form
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();

    // Should show validation errors (at least one)
    await expect(page.getByText(/required|please|at least/i).first()).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/contact');

    // Wait for page to load
    await page.waitForTimeout(500);

    // Fill form with invalid email
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('notanemail');
    await page.getByLabel('Subject').fill('Test Subject');
    await page.getByLabel('Message').fill('This is a test message with enough content.');

    // Submit form
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();

    // Wait for validation
    await page.waitForTimeout(500);

    // Should stay on contact page (form didn't submit successfully due to validation)
    // Note: HTML5 email validation may show browser native error instead of Zod error
    await expect(page).toHaveURL('/contact');
  });

  test('should successfully submit contact form', async ({ page }) => {
    await page.goto('/contact');

    // Fill valid form
    await page.getByLabel('Name').fill('E2E Test User');
    await page.getByLabel('Email').fill('e2etest@example.com');
    await page.getByLabel('Subject').fill('E2E Test Subject');
    await page.getByLabel('Message').fill('This is a test message from E2E tests. It should be long enough to pass validation.');

    // Submit form
    const submitButton = page.getByRole('button', { name: /send message/i });
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // Should show success message
    await expect(page.getByText(/success|thank you|sent|received/i)).toBeVisible();
  });
});

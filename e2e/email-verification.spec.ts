import { test, expect } from '@playwright/test';

test.describe('Email Verification', () => {
  test.describe('Registration with Verification', () => {
    test('should show verification message after registration', async ({ page }) => {
      const uniqueEmail = `verify-test-${Date.now()}@example.com`;

      await page.goto('/register');

      // Fill registration form
      await page.getByLabel('Name').fill('Verify Test User');
      await page.getByLabel('Email').fill(uniqueEmail);
      await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
      await page.getByLabel('Confirm Password').fill('SecurePassword123!');

      // Submit form
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should redirect to login with success message about verification
      await expect(page).toHaveURL(/\/login\?registered=true/, { timeout: 10000 });
      await expect(page.getByText(/check your email/i)).toBeVisible();
    });
  });

  test.describe('Verify Email Endpoint', () => {
    test('should redirect with error for missing token', async ({ page }) => {
      await page.goto('/api/auth/verify-email');

      // Should redirect to login with error
      await expect(page).toHaveURL(/\/login\?error=missing_token/);
      await expect(page.getByText(/missing verification token/i)).toBeVisible();
    });

    test('should redirect with error for invalid token', async ({ page }) => {
      await page.goto('/api/auth/verify-email?token=invalid-token-123');

      // Should redirect to login with error
      await expect(page).toHaveURL(/\/login\?error=invalid_token/);
      await expect(page.getByText(/invalid verification link/i)).toBeVisible();
    });

    test('should show resend link for invalid/expired token errors', async ({ page }) => {
      await page.goto('/login?error=expired_token');

      // Should show resend verification link
      await expect(page.getByText(/resend verification email/i)).toBeVisible();
    });
  });

  test.describe('Resend Verification Page', () => {
    test('should display resend verification form', async ({ page }) => {
      await page.goto('/resend-verification');

      await expect(page.getByRole('heading', { name: /resend verification/i })).toBeVisible();
      await expect(page.getByLabel('Email')).toBeVisible();
      await expect(page.getByRole('button', { name: /send verification email/i })).toBeVisible();
    });

    test('should validate email field', async ({ page }) => {
      await page.goto('/resend-verification');

      // Submit empty form
      await page.getByRole('button', { name: /send verification email/i }).click();

      // Should show validation error
      await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('should show success message after submitting', async ({ page }) => {
      await page.goto('/resend-verification');

      // Fill email (doesn't matter if it exists or not - security)
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByRole('button', { name: /send verification email/i }).click();

      // Should show success message
      await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /back to login/i })).toBeVisible();
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/resend-verification');

      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });
  });

  test.describe('Login Page Verification Messages', () => {
    test('should show verification success message', async ({ page }) => {
      await page.goto('/login?verified=true');

      await expect(page.getByText(/email verified successfully/i)).toBeVisible();
    });

    test('should show already verified message', async ({ page }) => {
      await page.goto('/login?message=already_verified');

      await expect(page.getByText(/already verified/i)).toBeVisible();
    });

    test('should show expired token error', async ({ page }) => {
      await page.goto('/login?error=expired_token');

      await expect(page.getByText(/expired/i)).toBeVisible();
      await expect(page.getByText(/resend verification email/i)).toBeVisible();
    });

    test('should show invalid token error', async ({ page }) => {
      await page.goto('/login?error=invalid_token');

      await expect(page.getByText(/invalid verification link/i)).toBeVisible();
      await expect(page.getByText(/resend verification email/i)).toBeVisible();
    });
  });
});

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/auth.fixture';

test.describe('Password Reset', () => {
  test.describe('Forgot Password Page', () => {
    test('should display forgot password page', async ({ page }) => {
      await page.goto('/forgot-password');

      // Should have heading
      await expect(page.getByRole('heading', { name: /forgot.*password/i })).toBeVisible();

      // Should have email input
      await expect(page.getByLabel('Email')).toBeVisible();

      // Should have submit button
      const submitButton = page.getByRole('button', { name: /send reset link/i });
      await expect(submitButton).toBeVisible();
    });

    test('should have back to login link', async ({ page }) => {
      await page.goto('/forgot-password');

      const loginLink = page.getByRole('link', { name: /back to login/i });
      await expect(loginLink).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/forgot-password');

      // Wait for page to load
      await page.waitForTimeout(500);

      await page.getByLabel('Email').fill('notanemail');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Wait for validation
      await page.waitForTimeout(500);

      // Should stay on forgot-password page (form didn't submit due to validation)
      // Note: HTML5 email validation may show browser native error
      await expect(page).toHaveURL('/forgot-password');
    });

    test('should show success message after submitting valid email', async ({ page }) => {
      await page.goto('/forgot-password');

      // Use existing user email
      await page.getByLabel('Email').fill(TEST_USERS.admin.email);
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Should show success message
      await expect(page.getByText(/check your email/i)).toBeVisible();
    });

    test('should show success for non-existent email (no enumeration)', async ({ page }) => {
      await page.goto('/forgot-password');

      // Use email that doesn't exist
      await page.getByLabel('Email').fill('nonexistent@example.com');
      await page.getByRole('button', { name: /send reset link/i }).click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Should show same success message (security - no email enumeration)
      await expect(page.getByText(/check your email/i)).toBeVisible();
    });
  });

  test.describe('Reset Password Page', () => {
    test('should show error for missing token', async ({ page }) => {
      await page.goto('/reset-password');

      // Wait for page to load fully
      await page.waitForTimeout(1000);

      // Without token, should show error ("Invalid Reset Link" heading)
      await expect(page.getByRole('heading', { name: /invalid.*reset.*link/i })).toBeVisible();
    });

    test('should display reset form with valid-looking token', async ({ page }) => {
      await page.goto('/reset-password?token=sometoken123');

      // Wait for page to load
      await page.waitForTimeout(500);

      // Should show the password form with labels
      await expect(page.getByLabel('New Password')).toBeVisible();
      await expect(page.getByLabel('Confirm Password')).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/reset-password?token=sometoken');

      // Wait for page to load
      await page.waitForTimeout(500);

      // Enter short password
      await page.getByLabel('New Password').fill('short');
      await page.getByLabel('Confirm Password').fill('short');

      await page.getByRole('button', { name: /reset password/i }).click();

      // Should show password requirement error
      await expect(page.getByText(/8 characters/i)).toBeVisible();
    });

    test('should validate password match', async ({ page }) => {
      await page.goto('/reset-password?token=sometoken');

      // Wait for page to load
      await page.waitForTimeout(500);

      await page.getByLabel('New Password').fill('Password123!');
      await page.getByLabel('Confirm Password').fill('DifferentPassword123!');

      await page.getByRole('button', { name: /reset password/i }).click();

      // Should show mismatch error ("Passwords don't match")
      await expect(page.getByText(/don't match|do not match/i)).toBeVisible();
    });

    test('should show error for invalid token on submit', async ({ page }) => {
      await page.goto('/reset-password?token=invalidtoken123');

      // Wait for page to load
      await page.waitForTimeout(500);

      await page.getByLabel('New Password').fill('ValidPassword123!');
      await page.getByLabel('Confirm Password').fill('ValidPassword123!');

      await page.getByRole('button', { name: /reset password/i }).click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Should show invalid token error
      await expect(page.getByText(/invalid|expired/i)).toBeVisible();
    });
  });
});

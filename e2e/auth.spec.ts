import { test, expect } from '@playwright/test';
import { TEST_USERS, loginAs } from './fixtures/auth.fixture';

test.describe('Authentication', () => {
  test.describe('Registration', () => {
    test('should register with valid data', async ({ page }) => {
      const uniqueEmail = `test-${Date.now()}@example.com`;

      await page.goto('/register');

      // Fill registration form
      await page.getByLabel('Name').fill('New Test User');
      await page.getByLabel('Email').fill(uniqueEmail);
      await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
      await page.getByLabel('Confirm Password').fill('SecurePassword123!');

      // Submit form - button says "Create Account"
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should redirect to login with success message
      await expect(page).toHaveURL(/\/login\?registered=true/, { timeout: 10000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/register');

      // Submit empty form
      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should show validation errors
      await expect(page.getByText(/at least 2 characters|required/i)).toBeVisible();
    });

    test('should show error for mismatched passwords', async ({ page }) => {
      await page.goto('/register');

      await page.getByLabel('Name').fill('Test User');
      await page.getByLabel('Email').fill('test@example.com');
      await page.getByLabel('Password', { exact: true }).fill('Password123!');
      await page.getByLabel('Confirm Password').fill('DifferentPassword123!');

      await page.getByRole('button', { name: 'Create Account' }).click();

      // Should show password mismatch error - actual message is "Passwords do not match"
      await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/register');

      // Use existing test user email
      await page.getByLabel('Name').fill('Duplicate User');
      await page.getByLabel('Email').fill(TEST_USERS.admin.email);
      await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
      await page.getByLabel('Confirm Password').fill('SecurePassword123!');

      await page.getByRole('button', { name: 'Create Account' }).click();

      // Wait for error response
      await page.waitForTimeout(1000);

      // Should show duplicate email error
      await expect(page.locator('.bg-error\\/10')).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill(TEST_USERS.admin.email);
      await page.getByLabel('Password').fill(TEST_USERS.admin.password);
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Should redirect away from login page
      await expect(page).not.toHaveURL('/login', { timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email').fill(TEST_USERS.admin.email);
      await page.getByLabel('Password').fill('wrongpassword');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for response
      await page.waitForTimeout(1000);

      // Should show error and stay on login page
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('.bg-error\\/10')).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.goto('/login');

      // Wait for page to load
      await page.waitForTimeout(500);

      await page.getByLabel('Email').fill('notanemail');
      await page.getByLabel('Password').fill('somepassword');
      await page.getByRole('button', { name: 'Sign In' }).click();

      // Wait for validation to trigger
      await page.waitForTimeout(500);

      // Should stay on login page (form didn't submit successfully)
      // Note: HTML5 email validation may show browser native error instead of Zod error
      await expect(page).toHaveURL(/\/login/);
    });

    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login');

      // Wait for page to load
      await page.waitForTimeout(500);

      // The link text is "Forgot password?" with a question mark
      const forgotLink = page.getByRole('link', { name: /forgot password/i });
      await expect(forgotLink).toBeVisible();

      await forgotLink.click();
      await expect(page).toHaveURL('/forgot-password');
    });

    test('should have register link', async ({ page }) => {
      await page.goto('/login');

      // Link text is "Sign up" in the login page
      const registerLink = page.getByRole('link', { name: 'Sign up' });
      await expect(registerLink).toBeVisible();

      await registerLink.click();
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing admin without auth', async ({ page }) => {
      await page.goto('/admin');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing profile without auth', async ({ page }) => {
      await page.goto('/profile');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should allow admin to access admin dashboard', async ({ page }) => {
      // Login as admin
      await loginAs(page, 'admin');

      // Navigate to admin
      await page.goto('/admin');

      // Should see dashboard
      await expect(page).toHaveURL('/admin');
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    });

    test('should allow author to access admin dashboard', async ({ page }) => {
      // Login as author
      await loginAs(page, 'author');

      // Navigate to admin
      await page.goto('/admin');

      // Should see dashboard
      await expect(page).toHaveURL('/admin');
      await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible();
    });

    test('should block subscriber from accessing admin', async ({ page }) => {
      // Login as subscriber
      await loginAs(page, 'subscriber');

      // Try to access admin
      await page.goto('/admin');

      // Should be redirected to login with error
      await expect(page).toHaveURL(/\/login.*error=unauthorized/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await loginAs(page, 'admin');

      // Open the user dropdown menu (avatar button)
      await page.locator('button:has(.h-9.w-9)').click();

      // Click Sign out
      await page.getByRole('menuitem', { name: /sign out/i }).click();

      // Wait for logout to complete
      await page.waitForTimeout(1000);

      // After logout, should be redirected to home
      await expect(page).toHaveURL('/');

      // Trying to access admin should redirect to login
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

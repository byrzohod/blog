import { test as base, Page, expect } from '@playwright/test';

// Test user credentials - must match prisma/seed-test.ts
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    name: 'Test Admin',
  },
  author: {
    email: 'author@test.com',
    password: 'TestPassword123!',
    name: 'Test Author',
  },
  subscriber: {
    email: 'subscriber@test.com',
    password: 'TestPassword123!',
    name: 'Test Subscriber',
  },
};

export type TestUser = keyof typeof TEST_USERS;

/**
 * Helper function to log in a user
 */
export async function loginAs(page: Page, user: TestUser | { email: string; password: string }) {
  const credentials = typeof user === 'string' ? TEST_USERS[user] : user;

  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for redirect (successful login)
  await expect(page).not.toHaveURL('/login', { timeout: 10000 });
}

/**
 * Helper function to log out
 */
export async function logout(page: Page) {
  // Look for logout button/link in header or user menu
  const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
  const logoutLink = page.getByRole('link', { name: /log out|sign out/i });

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  } else if (await logoutLink.isVisible()) {
    await logoutLink.click();
  }

  // Wait for redirect to home or login
  await expect(page).toHaveURL(/^\/$|\/login/);
}

/**
 * Helper to check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  // Check for presence of logout button or user menu
  const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
  const userMenu = page.getByRole('button', { name: /account|profile|menu/i });

  return (await logoutButton.isVisible()) || (await userMenu.isVisible());
}

// Extended fixtures for authenticated tests
type AuthFixtures = {
  adminPage: Page;
  authorPage: Page;
  subscriberPage: Page;
  loginAsAdmin: () => Promise<void>;
  loginAsAuthor: () => Promise<void>;
  loginAsSubscriber: () => Promise<void>;
};

/**
 * Extended test with pre-authenticated page fixtures
 */
export const test = base.extend<AuthFixtures>({
  // Pre-authenticated admin page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'admin');
    await use(page);
    await context.close();
  },

  // Pre-authenticated author page
  authorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'author');
    await use(page);
    await context.close();
  },

  // Pre-authenticated subscriber page
  subscriberPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, 'subscriber');
    await use(page);
    await context.close();
  },

  // Login helpers that use the default page
  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'admin');
    };
    await use(login);
  },

  loginAsAuthor: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'author');
    };
    await use(login);
  },

  loginAsSubscriber: async ({ page }, use) => {
    const login = async () => {
      await loginAs(page, 'subscriber');
    };
    await use(login);
  },
});

export { expect } from '@playwright/test';

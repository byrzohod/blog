import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test("should display the homepage", async ({ page }) => {
    await page.goto("/");

    // Check for main heading (the first h1)
    await expect(page.locator("h1").first()).toBeVisible();

    // Check for navigation links in the header
    const nav = page.locator("header nav");
    await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible();

    // Check for Sign In button (when logged out)
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("should navigate to blog page", async ({ page }) => {
    await page.goto("/");
    // Click the Blog link in the header navigation
    await page
      .locator("header nav")
      .getByRole("link", { name: "Blog" })
      .click();

    await expect(page).toHaveURL("/blog");
    // Blog page displays the path as h1
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have dark mode enabled by default", async ({ page }) => {
    await page.goto("/");

    // Verify dark mode is applied (forced dark theme)
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("Blog Page", () => {
  test("should display blog listing", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display welcome post if exists", async ({ page }) => {
    await page.goto("/blog");

    // Check for the seeded welcome post
    const welcomePost = page.getByText(/welcome to book of life/i).first();
    if (await welcomePost.isVisible()) {
      await welcomePost.click();
      await expect(page).toHaveURL(/\/blog\/welcome-to-book-of-life/);
    }
  });
});

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    // Use exact label match to avoid confusion
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: /create an account/i }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    // Use specific selectors for password fields
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirmPassword")).toBeVisible();
  });

  test("should show validation errors on empty login submit", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation errors
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();
  });
});

test.describe("Sitemap and Robots", () => {
  test("should serve sitemap.xml", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });

  test("should serve robots.txt", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Accessibility", () => {
  test("should have skip link", async ({ page }) => {
    await page.goto("/");

    // Focus on skip link
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: /skip to main content/i });
    await expect(skipLink).toBeFocused();
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1");
    await expect(h1.first()).toBeVisible();

    // Page should have at least one h1
    const count = await h1.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

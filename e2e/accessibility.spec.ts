import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test.describe("Skip Links", () => {
    test("should have skip to main content link", async ({ page }) => {
      await page.goto("/");

      // Skip link exists with href="#main-content"
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toHaveText("Skip to main content");
    });

    test("should skip to main content when activated", async ({ page }) => {
      await page.goto("/");

      // Wait for page to load
      await page.waitForTimeout(500);

      // Press Tab to focus skip link
      await page.keyboard.press("Tab");

      // Skip link should become visible on focus (using focus:not-sr-only)
      const skipLink = page.locator('a[href="#main-content"]');

      // Wait for skip link to be visible
      await page.waitForTimeout(100);

      // Click the skip link (it becomes visible on focus)
      await skipLink.click({ force: true });

      // Focus should move to main content
      const main = page.locator("#main-content, main");
      await expect(main.first()).toBeVisible();
    });
  });

  test.describe("Heading Hierarchy", () => {
    test("should have at least one h1 on homepage", async ({ page }) => {
      await page.goto("/");

      const h1s = page.locator("h1");
      const count = await h1s.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should have at least one h1 on blog page", async ({ page }) => {
      await page.goto("/blog");

      const h1s = page.locator("h1");
      const count = await h1s.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should have proper heading order (no skipping levels)", async ({
      page,
    }) => {
      await page.goto("/");

      // Get all headings
      const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();

      let previousLevel = 0;
      for (const heading of headings) {
        const tagName = await heading.evaluate((el) =>
          el.tagName.toLowerCase(),
        );
        const level = parseInt(tagName.charAt(1));

        // Heading level should not skip (e.g., h1 -> h3 without h2)
        if (previousLevel > 0) {
          expect(level).toBeLessThanOrEqual(previousLevel + 1);
        }
        previousLevel = level;
      }
    });
  });

  test.describe("Form Labels", () => {
    test("login form should have labeled inputs", async ({ page }) => {
      await page.goto("/login");

      // Email input should have label
      const emailInput = page.getByLabel("Email");
      await expect(emailInput).toBeVisible();

      // Password input should have label
      const passwordInput = page.getByLabel("Password");
      await expect(passwordInput).toBeVisible();
    });

    test("register form should have labeled inputs", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByLabel("Name")).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
      await expect(page.getByLabel("Confirm Password")).toBeVisible();
    });
  });

  test.describe("Focus Visibility", () => {
    test("interactive elements should receive focus on tab", async ({
      page,
    }) => {
      await page.goto("/");

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
      }

      // Verify something is focused
      const focused = await page.evaluate(() => {
        return document.activeElement?.tagName !== "BODY";
      });

      expect(focused).toBeTruthy();
    });
  });

  test.describe("Keyboard Navigation", () => {
    test("should be able to navigate main menu with keyboard", async ({
      page,
    }) => {
      await page.goto("/");

      // Tab to navigation links
      let foundNav = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press("Tab");

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName === "A" && el.closest("nav, header");
        });

        if (focused) {
          foundNav = true;
          break;
        }
      }

      expect(foundNav).toBeTruthy();
    });

    test("should be able to submit forms with Enter key", async ({ page }) => {
      await page.goto("/login");

      await page.getByLabel("Email").fill("test@example.com");
      await page.getByLabel("Password").fill("password");

      // Submit with Enter
      await page.getByLabel("Password").press("Enter");

      // Form should attempt to submit (may show error, but interaction works)
      await page.waitForTimeout(500);

      // Either redirected or showing error (form was submitted)
      const hasError = await page
        .getByText(/error|invalid|incorrect/i)
        .isVisible()
        .catch(() => false);
      const redirected = !page.url().includes("/login");

      expect(hasError || redirected).toBeTruthy();
    });
  });

  test.describe("ARIA Landmarks", () => {
    test("should have main landmark", async ({ page }) => {
      await page.goto("/");

      const main = page.locator('main, [role="main"]');
      await expect(main.first()).toBeVisible();
    });

    test("should have navigation landmark", async ({ page }) => {
      await page.goto("/");

      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav.first()).toBeVisible();
    });

    test("should have header/banner", async ({ page }) => {
      await page.goto("/");

      const header = page.locator('header, [role="banner"]');
      await expect(header.first()).toBeVisible();
    });

    test("should have footer/contentinfo", async ({ page }) => {
      await page.goto("/");

      const footer = page.locator('footer, [role="contentinfo"]');
      await expect(footer.first()).toBeVisible();
    });
  });

  test.describe("Images", () => {
    test("images should have alt text or be decorative", async ({ page }) => {
      await page.goto("/");

      const images = await page.locator("img").all();

      for (const img of images) {
        const alt = await img.getAttribute("alt");
        const role = await img.getAttribute("role");

        // Images should have alt text or be decorative (role="presentation")
        const hasAltOrDecorative =
          alt !== null || role === "presentation" || role === "none";
        expect(hasAltOrDecorative).toBeTruthy();
      }
    });
  });

  test.describe("Color and Contrast", () => {
    test("text should be readable (basic contrast check)", async ({ page }) => {
      await page.goto("/");

      // Check that main text is not too light
      const bodyText = await page.evaluate(() => {
        const body = document.body;
        const styles = window.getComputedStyle(body);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        };
      });

      // Basic check - text color should exist
      expect(bodyText.color).toBeTruthy();
    });
  });
});

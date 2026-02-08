import { test, expect, devices } from "@playwright/test";

/**
 * E2E Tests: Responsive Design
 *
 * Tests mobile and desktop layouts, navigation, and interactions.
 */

test.describe("Responsive Design", () => {
  test("should display mobile navigation on small screens", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Mobile navigation should be visible
    await expect(page.getByTestId("mobile-nav")).toBeVisible();

    // Desktop sidebar should be hidden
    await expect(page.getByTestId("desktop-sidebar")).not.toBeVisible();
  });

  test("should display desktop navigation on large screens", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Desktop sidebar should be visible
    await expect(page.getByTestId("desktop-sidebar")).toBeVisible();

    // Mobile navigation should be hidden
    await expect(page.getByTestId("mobile-nav")).not.toBeVisible();
  });

  test("should adapt post layout on mobile", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForSelector('[data-testid="post-card"]');

    const postCard = page.locator('[data-testid="post-card"]').first();

    // Post should be full width on mobile
    const box = await postCard.boundingBox();
    const viewportSize = page.viewportSize();

    if (box && viewportSize) {
      // Post width should be close to viewport width (accounting for padding)
      expect(box.width).toBeGreaterThan(viewportSize.width * 0.9);
    }
  });

  test("should show hamburger menu on mobile", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Mobile menu button should be visible
    const menuButton = page.getByRole("button", { name: /menu|navigation/i });
    await expect(menuButton).toBeVisible();

    // Click to open menu
    await menuButton.click();

    // Menu items should be visible
    await expect(page.getByRole("link", { name: /profile/i })).toBeVisible();
  });

  test("should stack profile info vertically on mobile", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.getByRole("link", { name: /profile/i }).click();

    // Stats should be visible and stacked
    const stats = page.getByTestId("profile-stats");
    const box = await stats.boundingBox();

    if (box) {
      // Height should be significant (stacked layout)
      expect(box.height).toBeGreaterThan(50);
    }
  });

  test("should hide sidebar on tablet", async ({ page }) => {
    await page.setViewportSize(devices["iPad Pro"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Right sidebar (Who to Follow) should be hidden on tablet
    const sidebar = page.getByTestId("who-to-follow-sidebar");

    if ((await sidebar.count()) > 0) {
      await expect(sidebar).not.toBeVisible();
    }
  });

  test("should make touch targets large enough on mobile", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForSelector('[data-testid="post-card"]');

    // Like button should be at least 44px (Apple's recommendation)
    const likeButton = page
      .locator('[data-testid="post-card"]')
      .first()
      .getByRole("button", { name: /like/i });

    const box = await likeButton.boundingBox();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("should adapt form inputs for mobile", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");

    const emailInput = page.getByLabel(/email/i);

    // Should have appropriate input type for mobile keyboard
    await expect(emailInput).toHaveAttribute("type", "email");

    const box = await emailInput.boundingBox();

    if (box) {
      // Input should be large enough for touch
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("should prevent zoom on input focus (mobile)", async ({ page }) => {
    await page.setViewportSize(devices["iPhone 12"].viewport);

    await page.goto("/auth/signin");

    // Font size should be at least 16px to prevent auto-zoom on iOS
    const emailInput = page.getByLabel(/email/i);
    const fontSize = await emailInput.evaluate((el) => window.getComputedStyle(el).fontSize);

    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(16);
  });
});

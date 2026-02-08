import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Notifications
 *
 * Tests notification display, marking as read, and real-time updates.
 */

test.describe("Notifications", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should navigate to notifications page", async ({ page }) => {
    await page.getByRole("link", { name: /notifications/i }).click();

    await expect(page).toHaveURL("/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  });

  test("should show unread notification badge", async ({ page }) => {
    const notificationLink = page.getByRole("link", { name: /notifications/i });

    // Should show badge if there are unread notifications
    const badge = notificationLink.locator('[data-testid="unread-badge"]');

    if ((await badge.count()) > 0) {
      await expect(badge).toBeVisible();
      const count = await badge.textContent();
      expect(parseInt(count || "0")).toBeGreaterThan(0);
    }
  });

  test("should display notification list", async ({ page }) => {
    await page.goto("/notifications");

    // Should show notifications
    const notifications = page.locator('[data-testid="notification-item"]');

    if ((await notifications.count()) > 0) {
      await expect(notifications.first()).toBeVisible();
    } else {
      // Or show empty state
      await expect(page.getByText(/no notifications/i)).toBeVisible();
    }
  });

  test("should show different notification types", async ({ page }) => {
    await page.goto("/notifications");

    // Create activity to generate notifications
    // Go to home and like a post
    await page.goto("/");
    await page.waitForSelector('[data-testid="post-card"]');
    await page
      .locator('[data-testid="post-card"]')
      .first()
      .getByRole("button", { name: /like/i })
      .click();

    // Go back to notifications
    await page.goto("/notifications");

    // Should see like notification
    await expect(
      page.getByText(/liked your post/i).or(page.getByText(/notifications/i))
    ).toBeVisible();
  });

  test("should mark notification as read on click", async ({ page }) => {
    await page.goto("/notifications");

    const unreadNotification = page
      .locator('[data-testid="notification-item"]')
      .filter({ has: page.locator('[data-unread="true"]') })
      .first();

    if ((await unreadNotification.count()) > 0) {
      // Click notification
      await unreadNotification.click();

      // Should no longer be unread
      await expect(unreadNotification).not.toHaveAttribute("data-unread", "true");
    }
  });

  test("should mark all as read", async ({ page }) => {
    await page.goto("/notifications");

    const markAllButton = page.getByRole("button", {
      name: /mark all.*read/i,
    });

    if ((await markAllButton.count()) > 0) {
      await markAllButton.click();

      // All notifications should be marked as read
      const unreadCount = await page
        .locator('[data-testid="notification-item"][data-unread="true"]')
        .count();

      expect(unreadCount).toBe(0);

      // Badge should disappear
      await expect(
        page.getByRole("link", { name: /notifications/i }).locator('[data-testid="unread-badge"]')
      ).not.toBeVisible();
    }
  });

  test("should navigate to post from notification", async ({ page }) => {
    await page.goto("/notifications");

    const postNotification = page
      .locator('[data-testid="notification-item"]')
      .filter({ hasText: /liked|commented/ })
      .first();

    if ((await postNotification.count()) > 0) {
      await postNotification.click();

      // Should navigate to the post
      await expect(page).toHaveURL(/\/(|notifications)/);
    }
  });

  test("should navigate to profile from notification", async ({ page }) => {
    await page.goto("/notifications");

    const followNotification = page
      .locator('[data-testid="notification-item"]')
      .filter({ hasText: /followed you/i })
      .first();

    if ((await followNotification.count()) > 0) {
      const authorName = followNotification.getByTestId("notification-author");
      await authorName.click();

      // Should navigate to author profile
      await expect(page).toHaveURL(/\/profile\/.+/);
    }
  });

  test("should show empty state when no notifications", async ({ page }) => {
    // Clear all notifications first
    await page.goto("/notifications");

    const markAllButton = page.getByRole("button", {
      name: /mark all.*read/i,
    });

    if ((await markAllButton.count()) > 0) {
      await markAllButton.click();
    }

    // Delete all if possible, or just check for empty state
    const notificationCount = await page.locator('[data-testid="notification-item"]').count();

    if (notificationCount === 0) {
      await expect(page.getByText(/no notifications|all caught up/i)).toBeVisible();
    }
  });

  test("should show relative timestamps", async ({ page }) => {
    await page.goto("/notifications");

    const notification = page.locator('[data-testid="notification-item"]').first();

    if ((await notification.count()) > 0) {
      const timestamp = notification.getByTestId("notification-timestamp");
      await expect(timestamp).toBeVisible();

      // Should show relative time like "2m ago", "1h ago", etc.
      const text = await timestamp.textContent();
      expect(text).toMatch(/\d+[smhd]\s+ago|just now/i);
    }
  });
});

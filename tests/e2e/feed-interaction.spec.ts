import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Feed Interaction
 *
 * Tests liking posts, commenting, infinite scroll, and real-time updates.
 */

test.describe("Feed Interaction", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should like a post", async ({ page }) => {
    // Wait for feed to load
    await page.waitForSelector('[data-testid="post-card"]', { timeout: 5000 });

    const firstPost = page.locator('[data-testid="post-card"]').first();
    const likeButton = firstPost.getByRole("button", { name: /like/i });

    // Get initial like count
    const likeCountBefore = await firstPost.getByTestId("like-count").textContent();

    // Click like
    await likeButton.click();

    // Should see optimistic update
    const likeCountAfter = await firstPost.getByTestId("like-count").textContent();
    expect(parseInt(likeCountAfter || "0")).toBeGreaterThan(parseInt(likeCountBefore || "0"));

    // Like button should show filled state
    await expect(likeButton).toHaveClass(/fill-current|text-red/);
  });

  test("should unlike a post", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();
    const likeButton = firstPost.getByRole("button", { name: /like/i });

    // Like the post first
    await likeButton.click();
    await page.waitForTimeout(500);

    const likeCountBefore = await firstPost.getByTestId("like-count").textContent();

    // Unlike
    await likeButton.click();

    // Count should decrease
    const likeCountAfter = await firstPost.getByTestId("like-count").textContent();
    expect(parseInt(likeCountAfter || "0")).toBeLessThan(parseInt(likeCountBefore || "0"));
  });

  test("should add a comment", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();

    // Click comment button to expand comment section
    await firstPost.getByRole("button", { name: /comment/i }).click();

    const commentContent = `Test comment at ${Date.now()}`;

    // Fill comment input
    await firstPost.getByPlaceholder(/write.*comment/i).fill(commentContent);

    // Submit comment
    await firstPost.getByRole("button", { name: /post comment|comment/i }).click();

    // Should see the new comment
    await expect(firstPost.getByText(commentContent)).toBeVisible();

    // Comment count should increase
    await expect(firstPost.getByTestId("comment-count")).toContainText(/\d+/);
  });

  test("should submit comment with Ctrl+Enter", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();
    await firstPost.getByRole("button", { name: /comment/i }).click();

    const commentContent = `Keyboard comment ${Date.now()}`;
    const commentInput = firstPost.getByPlaceholder(/write.*comment/i);

    await commentInput.fill(commentContent);
    await commentInput.press("Control+Enter");

    // Should see comment
    await expect(firstPost.getByText(commentContent)).toBeVisible();
  });

  test("should validate empty comment", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();
    await firstPost.getByRole("button", { name: /comment/i }).click();

    // Try to submit empty comment
    await firstPost.getByRole("button", { name: /post comment|comment/i }).click();

    // Should show validation error
    await expect(page.getByText(/comment.*empty/i)).toBeVisible();
  });

  test("should load more posts on scroll", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    // Get initial post count
    const initialCount = await page.locator('[data-testid="post-card"]').count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new posts to load
    await page.waitForTimeout(1000);

    // Should have more posts
    const newCount = await page.locator('[data-testid="post-card"]').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test("should show loading skeleton while loading", async ({ page }) => {
    await page.goto("/");

    // Should show loading skeletons initially
    await expect(page.getByTestId("post-skeleton")).toBeVisible();

    // Should disappear after posts load
    await page.waitForSelector('[data-testid="post-card"]');
    await expect(page.getByTestId("post-skeleton")).not.toBeVisible();
  });

  test("should handle like rate limiting", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const likeButton = page
      .locator('[data-testid="post-card"]')
      .first()
      .getByRole("button", { name: /like/i });

    // Rapidly like/unlike to trigger rate limit
    for (let i = 0; i < 101; i++) {
      await likeButton.click();
      await page.waitForTimeout(10);
    }

    // Should show rate limit error
    await expect(page.getByText(/too many requests/i)).toBeVisible();
  });

  test("should display post metadata correctly", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();

    // Should show author name
    await expect(firstPost.getByTestId("author-name")).toBeVisible();

    // Should show timestamp
    await expect(firstPost.getByTestId("post-timestamp")).toBeVisible();

    // Should show like count
    await expect(firstPost.getByTestId("like-count")).toBeVisible();

    // Should show comment count
    await expect(firstPost.getByTestId("comment-count")).toBeVisible();
  });

  test("should navigate to profile on author click", async ({ page }) => {
    await page.waitForSelector('[data-testid="post-card"]');

    const firstPost = page.locator('[data-testid="post-card"]').first();
    const authorLink = firstPost.getByTestId("author-link");

    await authorLink.click();

    // Should navigate to profile page
    await expect(page).toHaveURL(/\/profile\/.+/);
    await expect(page.getByRole("heading", { name: /.+/i })).toBeVisible();
  });
});

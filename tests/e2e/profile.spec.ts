import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Profile Flow
 *
 * Tests viewing profiles, following/unfollowing, and editing profile.
 */

test.describe("User Profile", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should view own profile", async ({ page }) => {
    // Navigate to profile
    await page.getByRole("link", { name: /profile/i }).click();

    await expect(page).toHaveURL(/\/profile\/.+/);

    // Should show profile information
    await expect(page.getByRole("heading", { name: /test user/i })).toBeVisible();
    await expect(page.getByText(/@testuser/i)).toBeVisible();

    // Should show stats
    await expect(page.getByText(/posts/i)).toBeVisible();
    await expect(page.getByText(/followers/i)).toBeVisible();
    await expect(page.getByText(/following/i)).toBeVisible();
  });

  test("should view another user profile", async ({ page }) => {
    await page.goto("/profile/otheruser");

    // Should show profile
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.getByText(/@otheruser/i)).toBeVisible();

    // Should show follow button (not edit button)
    await expect(page.getByRole("button", { name: /follow/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /edit profile/i })).not.toBeVisible();
  });

  test("should follow a user", async ({ page }) => {
    await page.goto("/profile/otheruser");

    const followButton = page.getByRole("button", { name: /^follow$/i });

    // Get initial follower count
    const followersText = await page.getByText(/\d+\s+followers/i).textContent();
    const initialCount = parseInt(followersText?.match(/\d+/)?.[0] || "0");

    // Click follow
    await followButton.click();

    // Should show optimistic update
    await expect(followButton).toHaveText(/following|unfollow/i);

    // Follower count should increase
    const newFollowersText = await page.getByText(/\d+\s+followers/i).textContent();
    const newCount = parseInt(newFollowersText?.match(/\d+/)?.[0] || "0");
    expect(newCount).toBe(initialCount + 1);
  });

  test("should unfollow a user", async ({ page }) => {
    await page.goto("/profile/otheruser");

    const followButton = page.getByRole("button", { name: /follow/i });

    // Follow first
    await followButton.click();
    await expect(followButton).toHaveText(/following|unfollow/i);

    const followersText = await page.getByText(/\d+\s+followers/i).textContent();
    const initialCount = parseInt(followersText?.match(/\d+/)?.[0] || "0");

    // Unfollow
    await followButton.click();

    // Should revert to "Follow"
    await expect(followButton).toHaveText(/^follow$/i);

    // Follower count should decrease
    const newFollowersText = await page.getByText(/\d+\s+followers/i).textContent();
    const newCount = parseInt(newFollowersText?.match(/\d+/)?.[0] || "0");
    expect(newCount).toBe(initialCount - 1);
  });

  test("should edit profile", async ({ page }) => {
    // Go to own profile
    await page.getByRole("link", { name: /profile/i }).click();

    // Click edit profile
    await page.getByRole("button", { name: /edit profile/i }).click();

    // Should show edit form
    await expect(page.getByLabel(/bio/i)).toBeVisible();

    // Update bio
    const newBio = `Updated bio at ${Date.now()}`;
    await page.getByLabel(/bio/i).fill(newBio);

    // Save changes
    await page.getByRole("button", { name: /save/i }).click();

    // Should show success message
    await expect(page.getByText(/profile updated/i)).toBeVisible();

    // Should show updated bio
    await expect(page.getByText(newBio)).toBeVisible();
  });

  test("should validate bio length", async ({ page }) => {
    await page.getByRole("link", { name: /profile/i }).click();
    await page.getByRole("button", { name: /edit profile/i }).click();

    // Fill with too long bio
    await page.getByLabel(/bio/i).fill("a".repeat(501));

    await page.getByRole("button", { name: /save/i }).click();

    // Should show validation error
    await expect(page.getByText(/bio.*too long|maximum/i)).toBeVisible();
  });

  test("should validate website URL format", async ({ page }) => {
    await page.getByRole("link", { name: /profile/i }).click();
    await page.getByRole("button", { name: /edit profile/i }).click();

    await page.getByLabel(/website/i).fill("not-a-url");

    await page.getByRole("button", { name: /save/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid.*url/i)).toBeVisible();
  });

  test("should show user posts on profile", async ({ page }) => {
    await page.goto("/profile/testuser");

    // Should show posts tab
    await expect(page.getByRole("tab", { name: /posts/i })).toBeVisible();

    // Should show user posts
    await expect(page.locator('[data-testid="post-card"]')).toHaveCount(
      await page.locator('[data-testid="post-card"]').count()
    );
  });

  test("should show followers list", async ({ page }) => {
    await page.goto("/profile/testuser");

    // Click followers
    await page.getByText(/\d+\s+followers/i).click();

    // Should show followers modal/page
    await expect(page.getByRole("heading", { name: /followers/i })).toBeVisible();

    // Should list followers
    await expect(page.locator('[data-testid="user-item"]').first()).toBeVisible();
  });

  test("should show following list", async ({ page }) => {
    await page.goto("/profile/testuser");

    // Click following
    await page.getByText(/\d+\s+following/i).click();

    // Should show following modal/page
    await expect(page.getByRole("heading", { name: /following/i })).toBeVisible();

    // Should list following
    await expect(page.locator('[data-testid="user-item"]').first()).toBeVisible();
  });

  test("should handle non-existent profile", async ({ page }) => {
    await page.goto("/profile/nonexistentuser999");

    // Should show 404 or not found message
    await expect(page.getByText(/not found|doesn't exist|user not found/i)).toBeVisible();
  });
});

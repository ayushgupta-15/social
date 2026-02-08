import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Post Creation Flow
 *
 * Tests creating posts with text and images, validation, and optimistic updates.
 */

test.describe("Post Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("should create a text post successfully", async ({ page }) => {
    const postContent = `Test post at ${Date.now()}`;

    // Fill in post content
    await page.getByPlaceholder(/what.*on your mind/i).fill(postContent);

    // Submit post
    await page.getByRole("button", { name: /^post$/i }).click();

    // Should show success toast
    await expect(page.getByText(/post created/i)).toBeVisible();

    // Should clear the form
    await expect(page.getByPlaceholder(/what.*on your mind/i)).toHaveValue("");

    // Should see the new post in the feed
    await expect(page.getByText(postContent)).toBeVisible();
  });

  test("should show character counter", async ({ page }) => {
    await page.getByPlaceholder(/what.*on your mind/i).fill("Test content");

    // Should show character count
    await expect(page.getByText(/\d+\/5000/)).toBeVisible();
  });

  test("should validate empty post", async ({ page }) => {
    await page.getByRole("button", { name: /^post$/i }).click();

    // Should show validation error
    await expect(page.getByText(/post cannot be empty/i)).toBeVisible();
  });

  test("should validate post length", async ({ page }) => {
    // Fill with content exceeding max length
    const longContent = "a".repeat(5001);
    await page.getByPlaceholder(/what.*on your mind/i).fill(longContent);

    // Character counter should show red/warning
    await expect(page.getByText(/5001\/5000/)).toBeVisible();

    await page.getByRole("button", { name: /^post$/i }).click();

    // Should show validation error
    await expect(page.getByText(/post too long/i)).toBeVisible();
  });

  test("should submit post with Ctrl+Enter", async ({ page }) => {
    const postContent = `Keyboard shortcut post ${Date.now()}`;

    await page.getByPlaceholder(/what.*on your mind/i).fill(postContent);

    // Press Ctrl+Enter (Cmd+Enter on Mac)
    await page.keyboard.press("Control+Enter");

    // Should show success
    await expect(page.getByText(/post created/i)).toBeVisible();

    // Should see the new post
    await expect(page.getByText(postContent)).toBeVisible();
  });

  test("should create post with image URL", async ({ page }) => {
    const postContent = `Post with image ${Date.now()}`;
    const imageUrl = "https://via.placeholder.com/400";

    await page.getByPlaceholder(/what.*on your mind/i).fill(postContent);
    await page.getByPlaceholder(/image url/i).fill(imageUrl);

    // Should show image preview
    await expect(page.getByRole("img", { name: /preview/i })).toBeVisible();

    await page.getByRole("button", { name: /^post$/i }).click();

    await expect(page.getByText(/post created/i)).toBeVisible();

    // Should see post with image in feed
    await expect(page.getByText(postContent)).toBeVisible();
    await expect(page.locator(`img[src="${imageUrl}"]`)).toBeVisible();
  });

  test("should remove image preview", async ({ page }) => {
    await page.getByPlaceholder(/image url/i).fill("https://via.placeholder.com/400");

    // Wait for preview to appear
    await expect(page.getByRole("img", { name: /preview/i })).toBeVisible();

    // Click remove button
    await page.getByRole("button", { name: /remove/i }).click();

    // Preview should be gone
    await expect(page.getByRole("img", { name: /preview/i })).not.toBeVisible();

    // Image URL field should be cleared
    await expect(page.getByPlaceholder(/image url/i)).toHaveValue("");
  });

  test("should validate image URL format", async ({ page }) => {
    await page.getByPlaceholder(/what.*on your mind/i).fill("Test post");
    await page.getByPlaceholder(/image url/i).fill("not-a-valid-url");

    await page.getByRole("button", { name: /^post$/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid.*url/i)).toBeVisible();
  });

  test("should disable post button while submitting", async ({ page }) => {
    await page.getByPlaceholder(/what.*on your mind/i).fill("Test post");

    const postButton = page.getByRole("button", { name: /^post$/i });

    await postButton.click();

    // Button should be disabled immediately
    await expect(postButton).toBeDisabled();
  });

  test("should handle rate limiting", async ({ page }) => {
    // Create multiple posts rapidly
    for (let i = 0; i < 11; i++) {
      await page.getByPlaceholder(/what.*on your mind/i).fill(`Post ${i}`);
      await page.getByRole("button", { name: /^post$/i }).click();

      if (i < 10) {
        await expect(page.getByText(/post created/i)).toBeVisible();
      }
    }

    // 11th post should be rate limited
    await expect(page.getByText(/too many requests/i)).toBeVisible();
  });
});

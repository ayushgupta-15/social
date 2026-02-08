import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Authentication Flow
 *
 * Tests the complete authentication flow including sign up, sign in, and sign out.
 */

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display sign in page for unauthenticated users", async ({ page }) => {
    await expect(page).toHaveURL(/\/auth\/signin/);
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("should sign in with valid credentials", async ({ page }) => {
    await page.goto("/auth/signin");

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to home page
    await expect(page).toHaveURL("/");

    // Should show user navigation
    await expect(page.getByRole("navigation")).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/signin");

    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();

    // Should remain on sign in page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/signin");

    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test("should navigate to sign up page", async ({ page }) => {
    await page.goto("/auth/signin");

    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/auth\/signup/);
    await expect(page.getByRole("heading", { name: /sign up/i })).toBeVisible();
  });

  test("should sign up with valid data", async ({ page }) => {
    await page.goto("/auth/signup");

    const timestamp = Date.now();
    await page.getByLabel(/name/i).fill("Test User");
    await page.getByLabel(/email/i).fill(`test${timestamp}@example.com`);
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should redirect to home page after successful sign up
    await expect(page).toHaveURL("/");
  });

  test("should validate password strength", async ({ page }) => {
    await page.goto("/auth/signup");

    await page.getByLabel(/name/i).fill("Test User");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("weak");
    await page.getByRole("button", { name: /sign up/i }).click();

    // Should show password validation error
    await expect(page.getByText(/password must.*uppercase.*lowercase.*number/i)).toBeVisible();
  });

  test("should sign out successfully", async ({ page }) => {
    // First sign in
    await page.goto("/auth/signin");
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL("/");

    // Then sign out
    await page.getByRole("button", { name: /menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();

    // Should redirect to sign in page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });
});

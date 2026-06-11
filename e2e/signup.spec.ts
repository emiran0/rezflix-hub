import { expect, test } from "@playwright/test";

// Runs on both desktop + Pixel-5 projects. Stays client-side (no account is created),
// so it's idempotent — the full create→session→redirect flow is exercised in Phase 8.3
// with proper DB fixtures.
test.describe("/signup", () => {
  test("renders without horizontal scroll", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("shows inline validation errors on empty submit", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    // Zod resolver surfaces field messages; nothing is sent to the server.
    await expect(
      page.getByText("Username must be at least 3 characters"),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("flags an invalid email", async ({ page }) => {
    await page.goto("/signup");
    await page.locator('input[autocomplete="username"]').fill("valid_user");
    await page.locator('input[type="email"]').fill("not-an-email");
    await page.locator('input[type="password"]').fill("supersecret12");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});

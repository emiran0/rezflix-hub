import { expect, test } from "@playwright/test";

// Runs on both desktop + Pixel-5 projects. Stays client-side (no real sign-in),
// so it's idempotent — the full credential→session→redirect flow is exercised in
// Phase 8.3 with proper DB fixtures.
test.describe("/login", () => {
  test("renders without horizontal scroll", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    const overflows = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });

  test("shows inline validation errors on empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Zod resolver surfaces field messages; nothing is sent to the server.
    await expect(page.getByText("Enter your username")).toBeVisible();
    await expect(page.getByText("Enter your password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

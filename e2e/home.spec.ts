import { expect, test } from "@playwright/test"

// Trivial smoke test — proves the Playwright pipeline (and dev server boot) works
// on both the desktop and mobile projects. Real flows are tested in Phase 8.
test("landing renders the hub name", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("REZFLIX Hub")).toBeVisible()
})

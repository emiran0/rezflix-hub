import { expect, test } from "@playwright/test"

// Trivial smoke test — proves the Playwright pipeline (and dev server boot) works
// on both the desktop and mobile projects. Real flows are tested in Phase 8.
test("landing renders the shell brand", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("link", { name: "REZFLIX Hub" })).toBeVisible()
})

// Verifies the responsive nav: the hamburger is hidden on desktop and opens a
// Sheet on mobile. Runs on both projects, asserting the right behaviour per width.
test("nav collapses to a sheet on mobile", async ({ page }) => {
  await page.goto("/")
  const trigger = page.getByRole("button", { name: "Open menu" })
  const isMobile = (page.viewportSize()?.width ?? 0) < 768

  if (!isMobile) {
    await expect(trigger).toBeHidden()
    return
  }

  await trigger.click()
  const sheet = page.getByRole("dialog")
  await expect(sheet).toBeVisible()
  await expect(sheet.getByRole("link", { name: "Apply" })).toBeVisible()
})

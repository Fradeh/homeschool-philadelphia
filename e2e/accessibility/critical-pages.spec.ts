import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

for (const [role, route] of [["admin", "/admin"], ["teacher", "/teacher/dashboard"], ["student", "/student/dashboard"]] as const) {
  test(`${role} dashboard no tiene violaciones axe serias o críticas`, async ({ page }) => {
    await loginAs(page, role);
    await page.goto(route);
    const result = await new AxeBuilder({ page }).analyze();
    const blocking = result.violations.filter((item) => item.impact === "critical" || item.impact === "serious");
    expect(blocking).toEqual([]);
  });
}

test("GCR permite navegación por teclado y conserva foco visible", async ({ page }) => {
  await loginAs(page, "teacher");
  await page.goto("/teacher/gcr?date=2026-07-10");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
});

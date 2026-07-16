import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 }
];

for (const viewport of viewports) {
  test(`rutas críticas no desbordan en ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await loginAs(page, "teacher");
    for (const route of ["/teacher/dashboard", "/teacher/classes", "/teacher/gcr", "/teacher/schedule"]) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(1);
      await expect(page.locator("main")).toBeVisible();
    }
  });
}

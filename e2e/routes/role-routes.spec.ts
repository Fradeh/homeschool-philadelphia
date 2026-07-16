import { expect, test } from "@playwright/test";
import { loginAs, trackConsoleErrors } from "../support/auth";
import { adminRoutes, studentRoutes, teacherRoutes } from "../support/routes";

for (const [role, routes] of Object.entries({ admin: adminRoutes, teacher: teacherRoutes, student: studentRoutes }) as Array<["admin" | "teacher" | "student", string[]]>) {
  test.describe(`${role} route smoke`, () => {
    test.beforeEach(async ({ page }) => loginAs(page, role));
    for (const route of routes) {
      test(`${route} renderiza sin error de consola`, async ({ page }) => {
        const errors = trackConsoleErrors(page);
        const response = await page.goto(route);
        expect(response?.status(), `${route} HTTP status`).toBeLessThan(400);
        await expect(page.locator("main")).toBeVisible();
        await expect(page.getByText(/Application error|Unhandled Runtime Error/i)).toHaveCount(0);
        expect(errors, `console errors at ${route}`).toEqual([]);
      });
    }
  });
}

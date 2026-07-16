import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

test("student no accede al portal teacher ni admin", async ({ page }) => {
  await loginAs(page, "student");
  for (const route of ["/teacher/dashboard", "/admin"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
  }
});

test("teacher no accede al portal admin ni student", async ({ page }) => {
  await loginAs(page, "teacher");
  for (const route of ["/admin", "/student/dashboard"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/$/);
  }
});

test("API protegida rechaza ausencia de cookie", async ({ request }) => {
  for (const path of ["/api/admin/overview", "/api/teacher/dashboard", "/api/student/dashboard", "/api/gcr/teacher/filters/classes?date=2026-07-10"]) {
    const response = await request.get(`http://127.0.0.1:${process.env.E2E_API_PORT ?? 4100}${path}`);
    expect(response.status(), path).toBe(401);
  }
});

test("student recibe 403 en API Teacher y Admin", async ({ page }) => {
  await loginAs(page, "student");
  for (const path of ["/api/teacher/dashboard", "/api/admin/overview", "/api/gcr/teacher/filters/classes?date=2026-07-10"]) {
    const response = await page.request.get(`http://127.0.0.1:${process.env.E2E_API_PORT ?? 4100}${path}`);
    expect(response.status(), path).toBe(403);
  }
});

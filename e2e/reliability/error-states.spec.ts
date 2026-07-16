import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

test("API 500 no produce pantalla blanca", async ({ page }) => {
  await loginAs(page, "teacher");
  await page.route("**/api/teacher/dashboard", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "QA forced failure" }) }));
  await page.goto("/teacher/dashboard");
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.getByText(/QA forced failure|No se pudo|error/i).first()).toBeVisible();
});

test("API desconectada muestra estado controlado", async ({ page }) => {
  await loginAs(page, "student");
  await page.route("**/api/student/dashboard", (route) => route.abort("connectionrefused"));
  await page.goto("/student/dashboard");
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.getByText(/No se pudo|error|intenta/i).first()).toBeVisible();
});

test("doble clic de login no genera múltiples navegaciones", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Correo institucional").fill("jose.pablo@philadelphia.demo");
  await page.locator('input[name="password"]').fill(process.env.E2E_DEMO_PASSWORD ?? "DemoPassword2026!");
  const button = page.getByRole("button", { name: "Iniciar sesión" });
  await button.dblclick();
  await expect(page).toHaveURL(/\/teacher\/dashboard/);
});

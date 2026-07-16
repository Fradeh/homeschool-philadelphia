import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

test("rechaza credenciales incorrectas sin crear sesión", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Correo institucional").fill("teacher@invalid.test");
  await page.locator('input[name="password"]').fill("IncorrectPassword1!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(/No pudimos iniciar sesión/i)).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
});

for (const role of ["admin", "teacher", "student"] as const) {
  test(`login, recarga y logout funcionan para ${role}`, async ({ page }) => {
    await loginAs(page, role);
    await page.reload();
    await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
}

test("ruta protegida directa vuelve al login sin sesión", async ({ page }) => {
  await page.goto("/teacher/dashboard");
  await expect(page).toHaveURL(/\/$/);
});

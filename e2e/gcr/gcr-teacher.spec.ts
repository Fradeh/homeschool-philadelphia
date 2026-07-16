import { expect, test } from "@playwright/test";
import { loginAs } from "../support/auth";

test.beforeEach(async ({ page }) => {
  await loginAs(page, "teacher");
  await page.goto("/teacher/gcr?date=2026-07-10");
  await page.getByLabel("Clase").selectOption({ index: 1 });
  await page.getByLabel("Estudiante").selectOption({ index: 1 });
});

test("filtros se reflejan en URL y la semana se carga", async ({ page }) => {
  await expect(page).toHaveURL(/classId=.*studentId=/);
  await expect(page.getByRole("heading", { name: /Goal Check Report/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Abrir reporte|Crear borrador/ }).first()).toBeVisible();
});

test("crear borrador, guardar asistencia y persistir tras recarga", async ({ page }) => {
  const create = page.getByRole("button", { name: "Crear borrador" }).first();
  if (await create.isVisible()) await create.click();
  else await page.getByRole("button", { name: "Abrir reporte" }).first().click();
  await expect(page.getByRole("dialog", { name: /GCR/i })).toBeVisible();
  await page.getByText("Presente", { exact: true }).click();
  for (const fieldset of await page.getByRole("group", { name: "¿Se asignó tarea?" }).all()) {
    await fieldset.getByText("No hubo", { exact: true }).click();
  }
  await page.getByRole("button", { name: /Guardar borrador|Guardar corrección/ }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Abrir reporte" }).first().click();
  await expect(page.getByText("Presente", { exact: true })).toBeVisible();
});

test("mérito y demérito se confirman solo después de API", async ({ page }) => {
  await page.getByRole("button", { name: /Abrir reporte|Crear borrador/ }).first().click();
  await page.getByRole("button", { name: "Agregar mérito" }).click();
  await page.getByLabel("Comentario").last().fill("Mérito QA");
  await page.getByRole("button", { name: "Registrar mérito" }).click();
  await expect(page.getByText(/Mérito: Mérito QA/)).toBeVisible();
  await page.getByRole("button", { name: "Registrar demérito" }).click();
  await page.getByText("Ordinal 1", { exact: true }).click();
  await page.getByLabel("Motivo").fill("Demérito QA");
  await page.getByRole("button", { name: "Registrar deméritos" }).click();
  await expect(page.getByText(/Ordinal 1: Demérito QA/)).toBeVisible();
});

test("submit incompleto enfoca faltantes sin éxito falso", async ({ page }) => {
  await page.getByRole("button", { name: /Abrir reporte|Crear borrador/ }).nth(1).click();
  await page.getByRole("button", { name: "Enviar GCR" }).click();
  await expect(page.getByText(/Faltan|Registrar asistencia/i).first()).toBeVisible();
  await expect(page.getByText("GCR enviado correctamente.")).toHaveCount(0);
});

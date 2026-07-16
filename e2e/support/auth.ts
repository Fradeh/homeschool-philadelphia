import { expect, type Page } from "@playwright/test";

export const users = {
  admin: { email: "directora.gabriela@philadelphia.demo", home: "/admin" },
  teacher: { email: "jose.pablo@philadelphia.demo", home: "/teacher/dashboard" },
  student: { email: "sofia.martinez@philadelphia.demo", home: "/student/dashboard" }
} as const;

export async function loginAs(page: Page, role: keyof typeof users) {
  const user = users[role];
  await page.goto("/");
  await page.getByLabel("Correo institucional").fill(user.email);
  await page.locator('input[name="password"]').fill(process.env.E2E_DEMO_PASSWORD ?? "DemoPassword2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(new RegExp(`${user.home.replaceAll("/", "\\/")}`));
}

export function trackConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

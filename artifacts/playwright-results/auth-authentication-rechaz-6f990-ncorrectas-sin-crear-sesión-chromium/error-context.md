# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\authentication.spec.ts >> rechaza credenciales incorrectas sin crear sesión
- Location: e2e\auth\authentication.spec.ts:4:5

# Error details

```
Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
    1) <input required="" minlength="8" type="password" name="password" placeholder="contraseña" autocomplete="current-password" class="password-input w-full bg-transparent text-[15px] font-medium text-[#191970] outline-none placeholder:text-[#191970]/38 disabled:cursor-not-allowed [font-family:Merta,Arial,sans-serif]"/> aka getByRole('textbox', { name: 'Contraseña Mostrar contraseña' })
    2) <button type="button" aria-pressed="false" aria-label="Mostrar contraseña" class="text-[#191970]/45 transition hover:text-[#191970] disabled:cursor-not-allowed">…</button> aka getByRole('button', { name: 'Mostrar contraseña' })

Call log:
  - waiting for getByLabel('Contraseña')

```

# Page snapshot

```yaml
- generic:
  - main [ref=e1]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - img [ref=e6]
        - generic [ref=e9]: Learning Ecosystem
      - navigation [ref=e10]:
        - link "Instagram" [ref=e11] [cursor=pointer]:
          - /url: https://www.instagram.com/philadelphiaschoolpty/
        - link "Facebook" [ref=e12] [cursor=pointer]:
          - /url: https://www.facebook.com/philadelphiaschoolpty
        - link "Web" [ref=e13] [cursor=pointer]:
          - /url: https://philadelphia-is.vercel.app/
    - generic [ref=e14]:
      - complementary [ref=e15]:
        - generic [ref=e18]:
          - heading "Formando líderes globales con excelencia académica y valores que perduran." [level=1] [ref=e19]
          - paragraph [ref=e20]: Philadelphia International School
      - generic [ref=e22]:
        - generic [ref=e23]:
          - generic "Philadelphia International School" [ref=e24]
          - heading "Portal Escolar" [level=1] [ref=e25]
          - paragraph [ref=e26]: Philadelphia International School
        - generic [ref=e27]:
          - generic [ref=e28]:
            - generic [ref=e29]: Correo institucional
            - generic [ref=e30]:
              - img [ref=e32]
              - textbox "Correo institucional" [active] [ref=e35]:
                - /placeholder: correo@philadelphia.edu
                - text: teacher@invalid.test
          - generic [ref=e36]:
            - generic [ref=e37]: Contraseña
            - generic [ref=e38]:
              - img [ref=e40]
              - textbox "Contraseña Mostrar contraseña" [ref=e43]:
                - /placeholder: contraseña
              - button "Mostrar contraseña" [ref=e44] [cursor=pointer]:
                - img [ref=e45]
          - button "Iniciar sesión" [ref=e48] [cursor=pointer]
        - generic [ref=e49]:
          - link "¿Necesitas ayuda para acceder?" [ref=e50] [cursor=pointer]:
            - /url: mailto:soporte@philadelphia.edu
          - paragraph [ref=e51]: Uso exclusivo de la comunidad educativa
  - button "Open Next.js Dev Tools" [ref=e57] [cursor=pointer]:
    - img [ref=e58]
  - alert [ref=e61]
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | import { loginAs } from "../support/auth";
  3  | 
  4  | test("rechaza credenciales incorrectas sin crear sesión", async ({ page }) => {
  5  |   await page.goto("/");
  6  |   await page.getByLabel("Correo institucional").fill("teacher@invalid.test");
> 7  |   await page.getByLabel("Contraseña").fill("IncorrectPassword1!");
     |                                       ^ Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
  8  |   await page.getByRole("button", { name: "Iniciar sesión" }).click();
  9  |   await expect(page.getByText(/No pudimos iniciar sesión/i)).toBeVisible();
  10 |   await expect(page).toHaveURL(/\/$/);
  11 | });
  12 | 
  13 | for (const role of ["admin", "teacher", "student"] as const) {
  14 |   test(`login, recarga y logout funcionan para ${role}`, async ({ page }) => {
  15 |     await loginAs(page, role);
  16 |     await page.reload();
  17 |     await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
  18 |     await page.getByRole("button", { name: "Cerrar sesión" }).click();
  19 |     await expect(page).toHaveURL(/\/$/);
  20 |   });
  21 | }
  22 | 
  23 | test("ruta protegida directa vuelve al login sin sesión", async ({ page }) => {
  24 |   await page.goto("/teacher/dashboard");
  25 |   await expect(page).toHaveURL(/\/$/);
  26 | });
  27 | 
```
# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\authentication.spec.ts >> login, recarga y logout funcionan para student
- Location: e2e\auth\authentication.spec.ts:14:7

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
                - text: sofia.martinez@philadelphia.demo
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
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | export const users = {
  4  |   admin: { email: "directora.gabriela@philadelphia.demo", home: "/admin" },
  5  |   teacher: { email: "jose.pablo@philadelphia.demo", home: "/teacher/dashboard" },
  6  |   student: { email: "sofia.martinez@philadelphia.demo", home: "/student/dashboard" }
  7  | } as const;
  8  | 
  9  | export async function loginAs(page: Page, role: keyof typeof users) {
  10 |   const user = users[role];
  11 |   await page.goto("/");
  12 |   await page.getByLabel("Correo institucional").fill(user.email);
> 13 |   await page.getByLabel("Contraseña").fill(process.env.E2E_DEMO_PASSWORD ?? "DemoPassword2026!");
     |                                       ^ Error: locator.fill: Error: strict mode violation: getByLabel('Contraseña') resolved to 2 elements:
  14 |   await page.getByRole("button", { name: "Iniciar sesión" }).click();
  15 |   await expect(page).toHaveURL(new RegExp(`${user.home.replaceAll("/", "\\/")}`));
  16 | }
  17 | 
  18 | export function trackConsoleErrors(page: Page) {
  19 |   const errors: string[] = [];
  20 |   page.on("console", (message) => {
  21 |     if (message.type() === "error") errors.push(message.text());
  22 |   });
  23 |   page.on("pageerror", (error) => errors.push(error.message));
  24 |   return errors;
  25 | }
  26 | 
```
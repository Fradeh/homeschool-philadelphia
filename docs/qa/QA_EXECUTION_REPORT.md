# QA Execution Report

**Fecha:** 2026-07-12  
**Commit:** no disponible; `.git` no fue reconocido por el entorno de comandos.  
**Entorno:** Windows local; Next 15.5.19, Nest 10, PostgreSQL 16, Chromium Playwright 149.  
**Base:** `homeschool_platform_test`, migrada con 9 migraciones y seed de 7 usuarios ficticios.  
**Storage:** local desechable. Nunca se usó producción ni Supabase productivo.

## Inventario

- Rutas web: 37/37 clasificadas.
- Handlers API: 107.
- Casos Playwright: 52 descubiertos en 7 archivos.
- Viewports configurados: 390×844, 768×1024, 1366×768, 1920×1080.

## Resultados ejecutados

| Suite | Ejecutados | PASS | FAIL | BLOCKED/SKIP | Nota |
|---|---:|---:|---:|---:|---|
| lint TypeScript | 3 workspaces | 3 | 0 | 0 | PASS |
| tests normales | 15 casos | 15 | 0 | 3 omitidos API | los 3 skips no cuentan PASS |
| build | 3 workspaces | 3 | 0 | 0 | PASS con red; falló en sandbox por Google Fonts |
| Prisma validate/generate | 2 | 2 | 0 | 0 | PASS |
| migraciones + seed test | 10 pasos | 10 | 0 | 0 | 9 migraciones + seed |
| integración API/DB habilitada | 12 | 11 | 1 | 0 | FAIL QA-015 |
| Playwright auth | 5 | 1 | 4 | 0 | fallos de selector revelan QA-016; locator corregido, rerun completo pendiente |
| Playwright restante | 47 | 0 | 0 | 47 | creado/listado; no ejecutado completamente |
| k6 smoke | 18 checks | 18 | 0 | 0 | p95 110.47 ms; p99 ≤ 113.47 ms observado |

## Consola/red

- API registra 401 esperado de `/auth/me` al probar ruta sin sesión.
- Next dev advierte `allowedDevOrigins` futuro para puertos 127.0.0.1.
- `next/font` requiere red para Google Inter; build sandbox falló, build con red PASS.
- Playwright produjo screenshots/traces/videos de fallos de autenticación.

## Pruebas omitidas y motivo

- 47 E2E: infraestructura quedó operativa, pero no hubo rerun integral tras corregir el locator y orden del reset.
- Supabase bucket de testing: no se proporcionó bucket/credenciales exclusivos.
- Sesión expirada real: no hay clock/control de expiración configurado en fixture browser.
- Usuario inactivo: seed no incluye uno y no se alteró producto para crearlo.
- Baseline k6: resultado se incorpora al terminar; si no aparece, queda BLOCKED.

## Evidencia

- `artifacts/playwright-results/`
- `artifacts/playwright-report/`
- `artifacts/playwright-results.json`
- `docs/qa/partials/*.md`

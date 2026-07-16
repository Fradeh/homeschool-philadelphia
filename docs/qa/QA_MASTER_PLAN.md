# QA Master Plan — HomeSchool Philadelphia

**Fecha:** 2026-07-12  
**Objetivo:** regresión integral local/staging, sin datos reales ni acciones destructivas fuera de una base exclusiva.

## Alcance

- 37 rutas Next.js, 107 handlers API y roles ADMIN, TEACHER, STUDENT, DIRECTOR y PARENT.
- Autenticación/autorización, Admin, Teacher, Student, gaps Director/Parent, GCR, datos, archivos, mensajería, responsive, accesibilidad, resiliencia y performance básica.
- No se corrigen defectos de producto en esta pasada. Solo infraestructura QA, documentación y selectores mínimos si fueran imprescindibles.

## Entorno seguro

- Web E2E: `127.0.0.1:3100` (configurable).
- API E2E: `127.0.0.1:4100` (configurable).
- PostgreSQL: `homeschool_platform_test` únicamente.
- Storage: `STORAGE_DRIVER=local`, directorio desechable `tmp/e2e-storage`.
- Fixtures sintéticos del seed demo protegido; contraseña de demo solo local.
- `playwright.config.ts` rechaza hosts no locales y bases cuyo nombre no contenga `test` o `qa`.
- Reset requiere `E2E_RESET_DATABASE=RESET_TEST_DATABASE`.

## Capas de prueba

1. TypeScript/lint, tests Node, build y Prisma validate/generate.
2. Migraciones desde base vacía, constraints e integridad PostgreSQL.
3. Playwright por recorrido: auth, rutas por rol, seguridad, GCR, accesibilidad, responsive y resiliencia.
4. k6 smoke antes de baseline, solo contra API local.
5. Evidencia en `artifacts/`: HTML, JSON, screenshot/video/trace únicamente en fallos.

## Casos y estado

- Playwright: 52 casos descubiertos en 7 archivos.
- Tests Node: 15 casos normales; 3 integraciones importantes son skip por defecto.
- Integración DB habilitada: 12 casos, sin skips.
- k6: smoke y baseline con journeys Student/Teacher.

Estados: PASS, FAIL, BLOCKED, NOT_IMPLEMENTED y NOT_APPLICABLE. Un skip se registra BLOCKED/OMITTED, nunca PASS.

## Orden de ejecución

```powershell
$env:CI='true'
$env:E2E_DATABASE_URL='postgresql://homeschool:homeschool@127.0.0.1:5432/homeschool_platform_test?schema=public'
$env:E2E_RESET_DATABASE='RESET_TEST_DATABASE'
pnpm qa:all
```

## Criterio de salida

- Demo: flujos principales navegables, sin P0; P1 conocidos con alternativa documentada.
- Piloto: 0 P0/P1 abiertos, persistencia/archivos/roles/GCR y responsive críticos en PASS.
- Producción: además, observabilidad, backups, secretos, despliegue, pruebas E2E completas y sin errores de consola.

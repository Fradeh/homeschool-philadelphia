# Despliegue

## Ambientes

- `staging`: API, web y PostgreSQL independientes de producción. Toda migración se valida aquí primero.
- `production`: desplegar web y API desde el mismo commit aprobado en CI.

Variables obligatorias de API: `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET` y `WEB_ORIGIN`. La web exige `NEXT_PUBLIC_API_URL` durante el build. Los secretos se administran en el proveedor, nunca en archivos versionados.

## Procedimiento

1. Crear un backup verificable de PostgreSQL.
2. Ejecutar `pnpm install --frozen-lockfile` y `pnpm ci`.
3. Ejecutar `pnpm db:deploy` contra staging.
4. Verificar `/api/health/readiness`, login por rol, horario publicado y flujo solicitud–aprobación.
5. Repetir `pnpm db:deploy` en producción y desplegar primero API, después web.
6. Confirmar logs estructurados y readiness antes de habilitar tráfico.

## Rollback

- Código: volver al artefacto del commit anterior.
- Base de datos: las migraciones son progresivas; no ejecutar SQL destructivo automático. Si una migración impide operar, retirar tráfico, restaurar el backup y desplegar el artefacto anterior.
- Conservar backups diarios, cifrados y con prueba de restauración mensual. La retención recomendada es 30 días.

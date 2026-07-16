# Checklist de aceptación V1

## Local

- [x] PostgreSQL responde en `localhost:5432`.
- [x] Las cuatro migraciones están aplicadas.
- [x] El seed puede ejecutarse repetidamente sin duplicar registros.
- [x] `/api/health` y `/api/health/readiness` responden correctamente.
- [x] Login y dashboard del alumno funcionan con datos persistentes.
- [x] Smoke API ADMIN → TEACHER → STUDENT → aprobación pasa contra PostgreSQL.
- [ ] Revisión visual manual en móvil, tableta y escritorio.
- [ ] Validar navegación por teclado, foco visible, etiquetas y contraste.
- [ ] Probar expiración de sesión y recuperación ante API desconectada.

## Recorrido por rol

- ADMIN: usuarios, grados, clases, materias, asignaciones y publicación del horario.
- TEACHER: dashboard, clases, horario, disponibilidad, reservas, PACEs, notas, mensajes y notificaciones.
- STUDENT: dashboard, clases, horario, reservas, calendario, PACEs, notas, mensajes y notificaciones.
- Las rutas de tareas, archivos y carga de contenido deben redirigir cuando `NEXT_PUBLIC_ENABLE_DEMO_DATA=false`.

## Puerta de staging

- [ ] Elegir proveedor para API/web y PostgreSQL.
- [ ] Configurar dominios HTTPS y `WEB_ORIGIN` exacto.
- [ ] Configurar secretos fuera del repositorio.
- [ ] Activar backups automáticos y realizar una restauración de prueba.
- [ ] Ejecutar `pnpm db:deploy`, smoke E2E y readiness en staging.
- [ ] Configurar alertas por errores 5xx, readiness y uso de base de datos.
- [ ] Realizar piloto con cuentas TEACHER y STUDENT no administrativas.
- [ ] Aprobar rollback antes de promover el mismo artefacto a producción.

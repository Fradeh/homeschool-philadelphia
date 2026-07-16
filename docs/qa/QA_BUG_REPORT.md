# QA Bug Report

Entorno: local, base `homeschool_platform_test`, datos ficticios. Estados `CANDIDATE` requieren reproducción adicional; no se presentan como confirmados.

## Resumen

| ID | Sev. | Estado | Título |
|---|---|---|---|
| QA-001 | P1 | Confirmado estático | Director/Parent redirigen a rutas inexistentes |
| QA-002 | P1 | Candidate | Groups/posts/calendar exponen contenido sin membership |
| QA-003 | P1 | Candidate alto | Teacher asignado solo por materia no gestiona PACEs |
| QA-004 | P2 | Confirmado | Rutas legado públicas/placeholder |
| QA-005 | P2 | Confirmado código | Calendario Student puede mezclar demo y API |
| QA-006 | P2 | Confirmado código | Editar usuario Admin no tiene acción |
| QA-007 | P2 | Confirmado código | Mutaciones Admin sin busy/catch/error visible |
| QA-008 | P3 | Confirmado código | Control Activar anida interacción no semántica |
| QA-009 | P2 | Confirmado código | Horario embebido de clase solo local |
| QA-010 | P2 | Confirmado código | Crear material puede dejar objeto huérfano |
| QA-011 | P2 | Confirmado código | Borrar material elimina storage antes que DB |
| QA-012 | P2 | Riesgo medido pendiente | Workspaces/listados completos sin paginación |
| QA-013 | P2 | Confirmado código | Student no cancela booking desde ruta activa |
| QA-014 | P2 | Confirmado código | Notificaciones no manejan error API |
| QA-015 | P2 | Reproducido | GCR integration test falla por fecha Prisma inválida |
| QA-016 | P3 | Reproducido | Nombre accesible de contraseña colisiona con mostrar contraseña |
| QA-017 | P3 | Confirmado código | Modales sin Escape/retorno de foco uniforme |
| QA-018 | P3 | Confirmado código | Buscador Admin visible pero inerte |

## Detalle reproducible

### QA-001 — Login Director/Parent termina en 404
- Rol/ruta: DIRECTOR/PARENT, `/director` o `/parent`.
- Precondición: usuario con un solo rol.
- Pasos: iniciar sesión; observar redirect de `getDefaultPortalPath`.
- Esperado: portal disponible o mensaje de funcionalidad no habilitada.
- Real: ruta no existe.
- Evidencia: `packages/shared/src/permissions.ts`; no existen páginas correspondientes.
- Recomendación: no ofrecer redirect hasta implementar superficie.

### QA-002 — Acceso cruzado en contenido de grupos
- Rol: cualquier autenticado; endpoints groups/posts/calendar.
- Pasos: crear grupos privados A/B; autenticar miembro solo de A; listar/comentar/publicar con ID de B.
- Esperado: 403/404 y ausencia de B.
- Real: services usan `findMany`/IDs sin filtro de membership (requiere reproducción final).
- Archivos: `groups.service.ts`, `posts.service.ts`, `calendar.service.ts`.

### QA-003 — PACEs ignora ClassSubjectTeacher
- Rol: TEACHER asignado solo a materia.
- Pasos: abrir workspace PACE y calificar registro de esa materia.
- Esperado: acceso a su materia.
- Real: filtros usan solo `AcademicClass.teachers`; candidato a vacío/403.
- Archivo: `academic-paces.service.ts`.

### QA-004 — Rutas legado públicas
- Rutas: `/dashboard`, `/groups`, `/calendar`.
- Real: placeholders sin gate, enlazados a superficie legado.
- Recomendación: retirar, redirigir o proteger según release.

### QA-005 — Calendario Student mezcla fuentes
- Ruta: `/student/calendar`.
- Real: importa datos mock y los combina si el flag demo está activo.
- Recomendación: CI/staging deben fijar `NEXT_PUBLIC_ENABLE_DEMO_DATA=false` y probarlo.

### QA-006/007 — Acciones Admin engañosas o frágiles
- Rutas: users/classes/families/settings/paces.
- Real: Editar usuario sin handler; varias mutaciones sin bloqueo ni error visible.
- Recomendación: implementar flujo real o retirar control; estandarizar estados API.

### QA-008 — Activar inaccesible
- Ruta: `/admin/settings`.
- Real: `span onClick` dentro de `button`.
- Esperado: un control semántico operable por teclado.

### QA-009 — Horario de clase no persiste
- Ruta: `/teacher/classes/:id?tab=schedule`.
- Real: mutaciones solo en estado React; se pierden al recargar.
- Recomendación: conectar API existente o marcar read-only.

### QA-010/011 — Inconsistencia DB/storage
- Ruta: materiales de clase.
- Real: upload sin compensación si Prisma falla; delete borra objeto antes de confirmar metadata.
- Riesgo: huérfanos o metadata rota.

### QA-012 — Payloads crecientes
- Rutas: dashboards, classroom workspace, Admin classes, conversations.
- Real: colecciones completas y patrón HTTP N+1 por clase.
- Recomendación: medir tamaño/p95 y paginar; no añadir caché sensible.

### QA-013 — Cancelación Student ausente en ruta activa
- Ruta: `/student/schedule`.
- Real: API existe, la UI activa no expone cancelar.

### QA-014 — Error de notificaciones no controlado
- Rutas: notificaciones Teacher/Student.
- Real: carga/marcado sin catch visible estable.

### QA-015 — Prueba integración GCR falla
- Comando: API test con `RUN_GCR_E2E=1` y base test.
- Real: 11 PASS, 1 FAIL; `gcr-api.test.cjs:135` pasa `"2026-07-07"` a filtro DateTime Prisma.
- Esperado: `Date`/ISO DateTime y continuación del flujo.
- Estado: defecto de prueba, no evidencia de fallo funcional GCR.

### QA-016 — Campo contraseña tiene nombre ambiguo
- Ruta: `/`.
- Pasos: consultar `getByLabel("Contraseña")`.
- Real: resuelve input y botón Mostrar contraseña porque el botón está dentro del label.
- Evidencia: Playwright 4 fallos de locator; snapshots en `artifacts/playwright-results`.
- Recomendación: separar el botón del label o usar `aria-labelledby` específico.

### QA-017/018 — UX Admin/modales
- Modales no aplican Escape, trap y retorno de foco de forma uniforme.
- Buscador Admin carece de handler/resultados.

No se detectó ningún P0 en esta ejecución.

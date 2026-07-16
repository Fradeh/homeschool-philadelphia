# QA Route Matrix

**Inventario:** 37/37 rutas clasificadas. La evidencia detallada (datos, endpoints, estados y accesos cruzados) está en `docs/qa/partials/ROUTE_AUTH_INVENTORY.md`.

Estados comunes obligatorios para cada pantalla funcional: loading, empty, success, validation error, API error, forbidden, not found, escritorio y móvil.

| # | Ruta | Rol | Función | API principal | Resultado | Evidencia / bug |
|---:|---|---|---|---|---|---|
| 1 | `/` | Público | Login | `/auth/*` | PARTIAL | 1/5 auth browser PASS; QA-001 |
| 2 | `/login` | Público | Redirect a `/` | — | PASS estático | page.tsx |
| 3 | `/dashboard` | Público/legado | Placeholder | — | NOT_IMPLEMENTED | QA-004 |
| 4 | `/groups` | Público/legado | Placeholder | — | NOT_IMPLEMENTED | QA-004 |
| 5 | `/calendar` | Público/legado | Placeholder | — | NOT_IMPLEMENTED | QA-004 |
| 6 | `/admin` | ADMIN | Dashboard | `/admin/overview` | BLOCKED E2E | route smoke creado |
| 7 | `/admin/users` | ADMIN | Usuarios/roles | `/admin/academic-users` | PARTIAL | QA-006, QA-007 |
| 8 | `/admin/classes` | ADMIN | Clases/matrículas | `/admin/classes` | BLOCKED E2E | QA-007 |
| 9 | `/admin/schedules` | ADMIN | Horarios | `/admin/schedule-*` | BLOCKED E2E | DB flow PASS |
| 10 | `/admin/families` | ADMIN | Familias | `/admin/family-links` | BLOCKED E2E | QA-007 |
| 11 | `/admin/paces` | ADMIN | Catálogo PACEs | `/admin/subjects` | BLOCKED E2E | QA-007 |
| 12 | `/admin/settings` | ADMIN | Años/períodos | `/admin/academic-years` | PARTIAL | QA-008 |
| 13 | `/teacher/dashboard` | TEACHER | Dashboard | `/teacher/dashboard` | BLOCKED E2E | QA-012 |
| 14 | `/teacher/classes` | TEACHER | Clases | `/classroom/teacher/classes` | BLOCKED E2E | route test creado |
| 15 | `/teacher/classes/[classId]` | TEACHER | Workspace | `/classroom/classes/:id` | PARTIAL | QA-009, QA-012 |
| 16 | `/teacher/assignments` | TEACHER | Tareas | Classroom | BLOCKED E2E | route test creado |
| 17 | `/teacher/calendar` | TEACHER | Calendario | `/calendar/events` | BLOCKED / SECURITY | QA-002 |
| 18 | `/teacher/files` | TEACHER | Materiales | Classroom/storage | BLOCKED | QA-010, QA-011 |
| 19 | `/teacher/gcr` | TEACHER | GCR | `/gcr/teacher/**` | FAIL integración parcial | QA-015; 4 browser casos creados |
| 20 | `/teacher/grades` | TEACHER | Notas PACE | `/teacher/grades` | BLOCKED | QA-003 |
| 21 | `/teacher/meetings` | Redirect | A horario | — | PASS estático | redirect |
| 22 | `/teacher/messages` | TEACHER | Mensajería | `/conversations/**` | BLOCKED | tests pendientes ejecución |
| 23 | `/teacher/notifications` | TEACHER | Notificaciones | `/notifications` | PARTIAL | QA-014 |
| 24 | `/teacher/paces` | TEACHER | PACEs | `/teacher/pace-*` | FAIL candidato | QA-003 |
| 25 | `/teacher/schedule` | TEACHER | Horario/reservas | `/teacher/schedule` | PASS API / BLOCKED UI | DB flow PASS |
| 26 | `/student/dashboard` | STUDENT | Dashboard | `/student/dashboard` | BLOCKED E2E | QA-012 |
| 27 | `/student/classes` | STUDENT | Clases | `/classroom/student/classes` | BLOCKED E2E | route test creado |
| 28 | `/student/classes/[classId]` | STUDENT | Workspace/entregas | Classroom | BLOCKED | seguridad/archivos pendientes |
| 29 | `/student/assignments` | STUDENT | Tareas | Classroom | BLOCKED E2E | route test creado |
| 30 | `/student/calendar` | STUDENT | Calendario | Calendar + posible demo | PARTIAL | QA-005 |
| 31 | `/student/files` | STUDENT | Materiales | Classroom/storage | BLOCKED | archivos ocultos pendientes |
| 32 | `/student/grades` | STUDENT | Notas | `/student/grades` | BLOCKED E2E | route test creado |
| 33 | `/student/meetings` | Redirect | A horario | — | PASS estático | redirect |
| 34 | `/student/messages` | STUDENT | Mensajería | `/conversations/**` | BLOCKED | pertenencia pendiente |
| 35 | `/student/notifications` | STUDENT | Notificaciones | `/notifications` | PARTIAL | QA-014 |
| 36 | `/student/paces` | STUDENT | PACEs | `/student/paces` | BLOCKED E2E | route test creado |
| 37 | `/student/schedule` | STUDENT | Horario/reservas | `/student/schedule` | PARTIAL | QA-013 |

## Gaps de rutas

- 0 rutas Parent y 0 rutas Director: PLANIFICADO/AUSENTE, no bugs de módulo; el redirect post-login sí es QA-001.
- 0 `loading.tsx`, 0 `error.tsx`, 0 middleware y solo layout raíz.
- Dos rutas dinámicas y tres redirects cubiertos por inventario; pruebas de IDs ajenos quedan pendientes de ejecución E2E completa.

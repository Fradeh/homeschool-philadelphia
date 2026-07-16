# Auditoría parcial — API, integridad de datos y performance

Fecha: 2026-07-12  
Alcance: `apps/api`, Prisma, seed, tests API/DB y k6.  
Método: inspección estática y comandos seguros; sin mutaciones de aplicación, sin migraciones, sin reset de datos y sin carga.

## Resumen

- Se inventariaron **107 handlers HTTP** distribuidos en 17 archivos controller.
- Autenticación vuelve a consultar usuario, estado y roles en cada request; un usuario desactivado queda rechazado aunque conserve un JWT previo.
- Classroom, schedules, conversations y GCR contienen verificaciones de pertenencia explícitas en sus servicios principales.
- GCR implementa control optimista por `version`, respuesta 409, unicidades y constraints PostgreSQL. Sus pruebas E2E/DB existen, pero quedan omitidas por defecto.
- El seed destructivo tiene guardas correctas: bloquea `NODE_ENV=production`, exige `DEMO_SEED_CONFIRM=RESET_LOCAL_DEMO`, host local y nombre de base permitido.
- Hay un candidato P1 de autorización en los módulos genéricos `groups/posts/calendar`, un candidato P1 funcional en PACEs para docentes asignados solo por materia, dos candidatos P2 de consistencia en storage y varios riesgos P2/P3 de crecimiento sin paginación.
- k6 existente es seguro por defecto frente a destinos remotos, pero solo mide login, sesión, listado y detalle de clases; no cubre escrituras, archivos, conversaciones, PACEs ni GCR.

## Resultado de comandos seguros

| Comando | Resultado real |
|---|---|
| `pnpm --filter @homeschool/api lint` | PASS |
| `pnpm --filter @homeschool/api test` | 12 descubiertos; 9 PASS; 0 FAIL; 3 SKIPPED |
| `pnpm --filter @homeschool/api exec prisma validate` | PASS |
| k6 smoke/baseline | NOT RUN; requiere servicios/credenciales controladas y no era seguro asumir el destino |
| migraciones/seed/integridad PostgreSQL | NOT RUN en esta pasada; no se proporcionó `TEST_DATABASE_URL` exclusiva confirmada |

Las tres pruebas omitidas fueron:

1. flujo API GCR con asignaciones, persistencia, concurrencia e idempotencia (`RUN_GCR_E2E=1` + `TEST_DATABASE_URL`);
2. constraints/migraciones GCR desde base vacía (`RUN_DB_INTEGRITY=1` + `TEST_DATABASE_URL`);
3. flujo Admin → disponibilidad Teacher → reserva Student (`RUN_E2E=1`, API local y base preparada).

Por tanto, el PASS unitario no demuestra persistencia PostgreSQL completa.

## Matriz de superficie API

| Prefijo/módulo | Handlers | Roles/guardas observadas | Persistencia y pertenencia | Cobertura actual | Riesgo principal |
|---|---:|---|---|---|---|
| `/auth` | 3 | login/logout públicos; `/me` JWT | login verifica `isActive`; JWT reconsulta usuario/roles | k6 + uso indirecto E2E | Falta suite negativa completa: expiración, cookie alterada, sesión revocada |
| `/admin` académicos | 20 | ADMIN + permissions | Prisma real, transacciones parciales, uniques | flujo E2E cubre parte del setup | Listados completos y payloads anidados sin paginación |
| `/users`, `/roles`, `/audit` | 3 | ADMIN + permissions | real; audit limitado a 100 | sin tests específicos | users sin paginación; audit sin cursor/filtros |
| `/teacher`, `/student` schedules | 17 | rol + permisos; ownership en service | real; booking tiene unique e invariantes | 6 unitarios + 1 E2E omitido | falta concurrencia real y errores 401/403/500 |
| `/classroom` | 17 | JWT + roles; `assertClassAccess`/`assertTeacherAccess` | real, storage local/Supabase, rollback en assignments/submissions | sin suite específica | workspace no paginado; inconsistencia en materiales/storage |
| `/teacher` y `/student` PACEs | 8 | rol + permisos; ownership en service | real, grade transaccional | sin tests específicos | docentes por materia quedan fuera del workspace/grade ownership |
| `/conversations` | 8 | roles + permission; participantes/escaladas | real; mensajes con cursor (máx. 50) | sin tests específicos | listado/contactos no paginados; falta negativa exhaustiva |
| `/gcr/teacher` | 12 | TEACHER; asignación y matrícula activas en service | real; transacciones, `version`, 409, audit append-only, checks DB | 3 unitarios PASS; 2 suites DB/E2E omitidas | evidencia completa bloqueada hasta ejecutar contra DB test |
| `/groups`, `/posts`, `/calendar` | 7 | JWT; writes con role/permission, reads/comments sin scope de pertenencia | Prisma real pero sin actor ni filtro de membership | sin tests | acceso cruzado a contenido de grupos y mutaciones por ID arbitrario |
| `/notifications` | 2 | JWT; `userId` aplicado en read/update | real; listado limitado 100 | comprobación cruzada parcial en production-flow | sin cursor; 404 apropiado para ID ajeno |
| `/files` | 1 | JWT | devuelve placeholder; no lista metadata real | sin tests | endpoint parece disponible pero declara storage pendiente |

## Bugs candidatos

### API-SEC-001 — Usuarios autenticados pueden enumerar contenido de grupos sin membresía

- Severidad candidata: **P1**.
- Rutas: `GET /groups`, `GET /posts`, `GET /calendar/events`, `POST /posts/:postId/comments`; también `POST /posts` para Teacher/Admin.
- Evidencia:
  - `apps/api/src/modules/groups/groups.service.ts:10-13` ejecuta `group.findMany()` sin filtro de usuario o visibilidad.
  - `apps/api/src/modules/posts/posts.service.ts:11-15` ejecuta `post.findMany()` incluyendo grupo/comentarios/adjuntos, sin membership.
  - `apps/api/src/modules/calendar/calendar.service.ts:10-13` devuelve todos los eventos, incluso los asociados a grupos.
  - `apps/api/src/modules/posts/posts.service.ts:18-25` acepta `dto.groupId` directamente; no verifica que el teacher administre o pertenezca al grupo.
  - `apps/api/src/modules/posts/posts.controller.ts:29-32` permite comentar a cualquier usuario autenticado; el service no valida acceso al post/grupo.
- Impacto: exposición o modificación cruzada de contenido marcado `PRIVATE` entre usuarios autenticados.
- Estado: **CANDIDATE / requiere reproducción API con dos grupos y dos usuarios**.
- Prueba recomendada: crear grupos privados A/B; autenticar usuario solo de A; intentar listar/ver/comentar/publicar mediante IDs de B; esperar 403/404 y ausencia de B en listados.

### API-DATA-002 — Posts, comentarios, grupos y eventos pierden atribución del actor

- Severidad candidata: **P2**.
- Evidencia: controllers no pasan `CurrentUser`; services crean registros sin `authorId`/`createdById` (`posts.service.ts`, `groups.service.ts`, `calendar.service.ts`).
- Impacto: acciones persistidas quedan sin autor aunque el modelo admite la relación; dificulta auditoría y ownership posterior.
- Estado: **CONFIRMADO POR CÓDIGO**, falta validar expectativa funcional del release.

### API-PACE-003 — Docente asignado solo a una materia no puede gestionar PACEs de esa materia

- Severidad candidata: **P1**.
- Evidencia:
  - `AcademicPacesService.getTeacherRecordCandidates` filtra únicamente `AcademicClass.teachers` (`academic-paces.service.ts:227-230`).
  - `teacherWorkspace` también lee records solo por `class.teachers` (`:43-50`).
  - `ensureTeacherOwnsRecord` repite ese criterio (`:297-312`).
  - En otros módulos, la asignación válida contempla tanto `ClassTeacher` como `ClassSubjectTeacher` (Classroom/GCR/Schedules).
- Impacto: un profesor de materia puede ver su clase en otras áreas pero PACEs aparece vacío o devuelve 403 al actualizar/calificar.
- Estado: **CANDIDATE MUY ALTO / requiere fixture con solo `ClassSubjectTeacher`**.

### API-STORAGE-004 — Crear material puede dejar un objeto huérfano si falla Prisma

- Severidad candidata: **P2**.
- Evidencia: `classroom.service.ts:421` almacena el archivo y `:427` crea metadata sin `try/catch` compensatorio. Assignments y submissions sí implementan cleanup explícito.
- Reproducción sugerida: storage test exitoso + forzar fallo DB después del upload; confirmar que el objeto permanece sin `ClassMaterial`.
- Estado: **CONFIRMADO POR FLUJO DE CÓDIGO**, no reproducido para evitar mutaciones.

### API-STORAGE-005 — Eliminar material borra el objeto antes de confirmar la eliminación DB

- Severidad candidata: **P2**.
- Evidencia: `classroom.service.ts:705-706` ejecuta `storage.deleteObject()` antes de `classMaterial.delete()`.
- Impacto: si DB falla después del borrado físico, queda metadata apuntando a un objeto inexistente.
- Estado: **CONFIRMADO POR FLUJO DE CÓDIGO**, no reproducido.

### API-PERF-006 — Workspace de clase carga el historial completo y todas las entregas

- Severidad candidata: **P2** (degradación progresiva).
- Evidencia: `workspaceInclude` en `classroom.service.ts:28-55` incluye todos los posts + comentarios, assignments + submissions + attachments y materiales, sin `take`, cursor ni ventana temporal.
- Impacto: payload y costo DB crecen con cada día de uso; cada creación vuelve a llamar `workspace()` completo.
- Prueba sugerida: dataset de 1 clase con 100 posts, 100 assignments, 30 estudiantes y adjuntos; medir response size, p95/p99 y memoria sin ejecutar sobre producción.

### API-PERF-007 — Listados administrativos y de comunicación carecen de paginación

- Severidad candidata: **P2/P3** según volumen.
- Evidencia: users, clases, subjects, family-links, conversations, groups, posts y calendar usan `findMany` sin `take/cursor`; Admin classes anida docentes, estudiantes, materias, PACEs y responsables.
- Nota positiva: mensajes de conversación sí tienen cursor, límite por defecto 30 y máximo 50.
- Recomendación: medir payload y query time primero; priorizar Admin classes, classroom workspace y conversations list.

### API-PERF-008 — Rate limiter en memoria conserva claves expiradas indefinidamente

- Severidad candidata: **P3** local / **P2** en servicio prolongado.
- Evidencia: `apps/api/src/main.ts:12-23` mantiene un `Map`; reemplaza la entrada al reutilizar la misma clave, pero no barre claves que nunca vuelven a consultarse. La clave incluye path.
- Impacto: crecimiento de memoria con IPs/rutas/IDs distintos; además no coordina límites entre múltiples instancias.
- Recomendación: primero instrumentar tamaño/cardinalidad; normalizar ruta y agregar cleanup acotado. No introducir Redis sin métricas y necesidad multi-instancia.

### API-VALID-009 — `role` de `GET /admin/academic-users` no usa DTO enum validado

- Severidad candidata: **P3**.
- Evidencia: `@Query("role") role?: UserRole` pasa una cadena directamente al filtro Prisma; a diferencia de DTOs, el tipo TS no valida runtime.
- Resultado a verificar: un valor inválido debe producir 400 estable, no 500/Prisma error.

### API-GAP-010 — `GET /files` es un placeholder autenticado

- Clasificación: **PARCIAL / no registrar como bug si el release no promete listado general de archivos**.
- Evidencia: responde `items: []` y mensaje `Storage provider is pending`, aunque Classroom ya usa `StorageService` real para adjuntos/materiales.
- Riesgo: una UI que trate el 200 como funcional puede mostrar éxito vacío engañoso.

### API-GCR-011 — Detención ordinal 3 usa día calendario, no día lectivo

- Clasificación: **DEUDA CONOCIDA / potencial P2 según especificación**.
- Evidencia: TODO en `gcr.service.ts:796`; suma un día calendario.
- No clasificar definitivamente hasta contrastar con `GCR_SPEC.md` y calendario escolar disponible.

## Integridad y controles positivos observados

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`.
- JWT por cookie HttpOnly o bearer; expiración activa y estado/roles revalidados contra DB.
- Errores 500 devuelven mensaje genérico al cliente; el stack queda en logger, no en response.
- Classroom valida pertenencia antes de workspace, muro, assignments, submissions y downloads; material oculto devuelve 404 a Student.
- Submission tiene unique `(assignmentId, studentId)` y adjuntos con `storageKey` unique.
- Booking tiene unique de estudiante/materia/fecha/hora y validaciones de transición.
- Conversations exige participante; Director solo puede incorporarse a conversaciones escaladas; mensajes están paginados.
- GCR tiene unique por estudiante/clase/fecha, checks de versión/slot/score/comentarios/detención, auditoría append-only y control optimista transaccional.
- Seed destructivo requiere cuatro condiciones de seguridad y no se ejecutó.
- k6 rechaza destinos remotos salvo confirmación explícita y exige `/api` en base URL.

## Huecos de pruebas API/Data

- No hay tests automatizados específicos para Classroom/archivos/materiales.
- No hay tests de Groups/Posts/Calendar con pertenencia cruzada.
- No hay tests de PACEs para `ClassSubjectTeacher` sin `ClassTeacher`.
- No hay tests de Conversations para ID ajeno, escalado, edición de mensaje ajeno, paginación y Director.
- No hay matriz exhaustiva 400/401/403/404/409/500.
- No hay pruebas de rollback/compensación entre storage y DB.
- No hay prueba automatizada Supabase contra bucket exclusivo de testing.
- La suite normal reporta verde aunque 3 suites importantes estén SKIPPED; CI solo fija `RUN_E2E=1`, no `RUN_GCR_E2E`, `RUN_DB_INTEGRITY` ni `TEST_DATABASE_URL`.
- k6 no registra payload size como métrica/threshold y no recorre GCR, conversaciones, archivos, dashboard o PACEs.

## Comandos seguros sugeridos para una base exclusiva

No ejecutar hasta confirmar que `TEST_DATABASE_URL` apunta exclusivamente a `homeschool_platform_test` local/staging y que `STORAGE_DRIVER=local` usa un directorio desechable.

```powershell
$env:NODE_ENV='test'
$env:DATABASE_URL='postgresql://homeschool:homeschool@localhost:5432/homeschool_platform_test?schema=public'
$env:TEST_DATABASE_URL=$env:DATABASE_URL
$env:STORAGE_DRIVER='local'

pnpm --filter @homeschool/api exec prisma validate
pnpm --filter @homeschool/api prisma:generate
pnpm --filter @homeschool/api prisma:deploy

$env:RUN_GCR_E2E='1'
$env:RUN_DB_INTEGRITY='1'
pnpm --filter @homeschool/api test
```

`production-flow.test.cjs` requiere además una API local levantada y `RUN_E2E=1`; no debe apuntarse a un servidor compartido porque crea y elimina fixtures.

Smoke k6, solo después de preparar cuentas sintéticas y confirmar URL local:

```powershell
$env:LOAD_TEST_BASE_URL='http://localhost:4000/api'
$env:LOAD_TEST_STUDENT_EMAIL='student-test@local.test'
$env:LOAD_TEST_STUDENT_PASSWORD='<password-de-testing>'
$env:LOAD_TEST_TEACHER_EMAIL='teacher-test@local.test'
$env:LOAD_TEST_TEACHER_PASSWORD='<password-de-testing>'
pnpm --filter @homeschool/api load:smoke
```

No se recomienda ejecutar `load:baseline` hasta que smoke sea 100% estable, se capture tamaño de payload y el destino se confirme no productivo.

## Priorización recomendada sin implementar

1. Reproducir y cerrar `API-SEC-001` con fixtures de dos grupos/usuarios; bloquear release si se confirma.
2. Reproducir `API-PACE-003` con un docente asignado solo a `ClassSubjectTeacher`.
3. Añadir pruebas de compensación storage/DB antes de modificar la implementación de materiales.
4. Ejecutar GCR E2E + DB integrity en `homeschool_platform_test`; reflejar SKIPPED como BLOCKED, no PASS.
5. Medir `classroom workspace`, Admin classes y conversations list con datasets crecientes; paginar solo después del baseline.
6. Extender smoke k6 con dashboard, conversations, GCR read y métricas de response size, manteniendo escrituras fuera del baseline inicial.

## Archivos modificados por este agente

- `docs/qa/partials/API_DATA_PERFORMANCE.md` únicamente.


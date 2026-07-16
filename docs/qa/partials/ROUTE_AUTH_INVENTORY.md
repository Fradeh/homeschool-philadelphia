# Inventario parcial de rutas y autenticación/autorización

**Alcance:** inventario estático de `apps/web/app/**`, navegación, redirecciones, gates web y guards/controles de pertenencia del API.  
**Fecha:** 2026-07-12  
**Ejecución:** solo lectura del producto; no se realizaron pruebas de navegador ni llamadas contra base de datos. Por ello, una ruta funcional se marca `BLOCKED` hasta que la ejecución integrada aporte evidencia.  
**Criterios aplicados:** `AGENTS.md`, `docs/GCR_SPEC.md`, `docs/PROPOSAL_TECHNICAL_INVENTORY.md`, Vercel React Best Practices, Web Interface Guidelines, MVP Persistence Fixer y Performance MVP Optimizer.

## Resumen exacto

- **37** archivos `page.tsx` y **37** rutas Next.js.
- **1** layout (`apps/web/app/layout.tsx`), únicamente raíz.
- **0** `loading.tsx`, **0** `error.tsx`, **0** `not-found.tsx` y **0** middleware web.
- **2** rutas dinámicas: `/teacher/classes/[classId]` y `/student/classes/[classId]`.
- **3** redirecciones declarativas: `/login` → `/`, `/teacher/meetings` → `/teacher/schedule`, `/student/meetings` → `/student/schedule`.
- Distribución: **5 públicas/legado**, **7 Admin**, **13 Teacher**, **12 Student**.
- Superficies funcionales protegidas (sin contar redirects): **30**.
- Navegación declarada: **7 Admin**, **11 Teacher**, **10 Student**, **4 legado**.
- **0** rutas Parent y **0** rutas Director, aunque `getDefaultPortalPath()` puede redirigir a `/parent` y `/director`.

## Convenciones de endpoints

| Alias | Endpoints reales principales |
| --- | --- |
| AUTH | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| ADMIN-ACADEMIC | `/admin/overview`, `/admin/academic-years/**`, `/admin/academic-users/**`, `/admin/classes/**`, `/admin/subjects/**`, `/admin/family-links/**` |
| ADMIN-SCHEDULE | `/admin/grade-levels`, `/admin/schedule-grid`, `/admin/schedule-templates/**`, `/admin/class-subjects/:id/teachers` |
| CLASSROOM-T | `/classroom/teacher/classes`, `/classroom/classes/:classId/**`, tareas, materiales, entregas, calificación y descargas |
| CLASSROOM-S | `/classroom/student/classes`, `/classroom/classes/:classId/**`, muro, entrega, eliminación propia y descargas autorizadas |
| SCHEDULE-T | `/teacher/dashboard`, `/teacher/classes`, `/teacher/schedule`, `/teacher/availability/**`, `/teacher/bookings/**` |
| SCHEDULE-S | `/student/dashboard`, `/student/classes`, `/student/schedule`, `/student/subjects/:id/availability`, `/student/bookings/**` |
| PACE-T | `/teacher/pace-workspace/**`, `/teacher/pace-records/**`, `/teacher/grades/**` |
| PACE-S | `/student/paces`, `/student/grades` |
| MSG | `/conversations`, `/conversations/contacts`, `/conversations/:id/messages/**`, `/conversations/:id/escalate` |
| CAL | `GET /calendar/events`; `POST /calendar/events` para Admin/Teacher con permiso |
| NOTIF | `GET /notifications`, `PATCH /notifications/:id/read` |
| GCR | `/gcr/teacher/filters/**`, `/students/:id/week`, `/reports/**` |

Todos los endpoints anteriores usan cookie `homeschool_access_token` HTTP-only mediante `credentials: "include"`. Los downloads también pasan por la API autenticada.

## Matriz completa de rutas

Los estados exigidos para cada pantalla funcional son: **loading, empty, success, validation error, API error, forbidden y not found**, además de escritorio y móvil. La columna “Estados específicos” añade los casos propios de cada ruta; no reemplaza esos siete estados comunes.

| # | Ruta | Pantalla / rol web | Datos requeridos | Acciones principales | Endpoint(s) | Estados específicos | Resultado estático / evidencia |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `/` | Login / Público | credenciales | iniciar sesión, mostrar/ocultar contraseña | AUTH | credenciales inválidas, usuario inactivo, sesión existente | `BLOCKED`; `apps/web/app/page.tsx`, `components/auth/login-card.tsx` |
| 2 | `/login` | Alias login / Público | ninguno | redirigir a `/` | ninguno | redirect | `PASS` estático; `apps/web/app/login/page.tsx:4` |
| 3 | `/dashboard` | Dashboard legado / Público | ninguno | navegar a legado/Admin | ninguno | contenido placeholder | `NOT_IMPLEMENTED`; sin `PortalAuthGate`, `app/dashboard/page.tsx` |
| 4 | `/groups` | Grupos legado / Público | ninguno | ninguna acción funcional | ninguno | placeholder | `NOT_IMPLEMENTED`; sin `PortalAuthGate`, `app/groups/page.tsx` |
| 5 | `/calendar` | Calendario legado / Público | ninguno | ninguna acción funcional | ninguno | placeholder | `NOT_IMPLEMENTED`; sin `PortalAuthGate`, `app/calendar/page.tsx` |
| 6 | `/admin` | Resumen académico / ADMIN | overview, clases | abrir usuarios/clases/familias/PACEs | ADMIN-ACADEMIC | métricas y clases recientes | `BLOCKED`; `AdminPortalShell` + `AdminDashboardPage.tsx` |
| 7 | `/admin/users` | Usuarios / ADMIN | usuarios, grados | filtrar, crear usuario/rol/perfil | ADMIN-ACADEMIC, ADMIN-SCHEDULE | rol, grado, duplicado, usuario inactivo | `BLOCKED`; `AdminUsersPage.tsx` |
| 8 | `/admin/classes` | Clases / ADMIN | clases, usuarios, materias, años, grados | crear clase, asignar Teacher/materia, matricular Student | ADMIN-ACADEMIC, ADMIN-SCHEDULE | pertenencia de grado, duplicados | `BLOCKED`; `AdminClassesPage.tsx` |
| 9 | `/admin/schedules` | Horarios / ADMIN | grados, grid, plantillas, años, clases | crear grado/plantilla, editar bloques, asignar profesor, guardar/publicar | ADMIN-SCHEDULE, ADMIN-ACADEMIC | plantilla incompleta, colisiones, publicación | `BLOCKED`; `AdminSchedulesPage.tsx` |
| 10 | `/admin/families` | Familias / ADMIN | vínculos, Students, Parents | crear vínculo, alternar 4 permisos | ADMIN-ACADEMIC | vínculo duplicado/inexistente | `BLOCKED`; `AdminFamiliesPage.tsx` |
| 11 | `/admin/paces` | Catálogo PACEs / ADMIN | materias, clases | crear materia, cambiar color, garantizar cantidad de PACEs | ADMIN-ACADEMIC | objetivo inválido/duplicado | `BLOCKED`; `AdminPacesPage.tsx` |
| 12 | `/admin/settings` | Año y períodos / ADMIN | años/términos | crear/activar año, crear término | ADMIN-ACADEMIC | fechas solapadas, año activo | `BLOCKED`; `AdminSettingsPage.tsx` |
| 13 | `/teacher/dashboard` | Inicio / TEACHER (ADMIN admitido por gate) | resumen docente + workspaces asignados | abrir clases/tareas/horario/mensajes | SCHEDULE-T, CLASSROOM-T | sin clases/actividad | `BLOCKED`; `TeacherDashboardV1.tsx` |
| 14 | `/teacher/classes` | Mis clases / TEACHER (ADMIN admitido por gate) | clases asignadas | buscar/filtrar, abrir clase | CLASSROOM-T | lista vacía | `BLOCKED`; `TeacherClassesPage.tsx` |
| 15 | `/teacher/classes/[classId]` | Workspace de clase / TEACHER (ADMIN admitido por gate) | `classId`, workspace autorizado | muro/comentarios, tarea, contenido, alumnos, horario, actividad, entregas/calificación | CLASSROOM-T | `tab=wall|paces|assignments|content|students|schedule|activity`; ID ajeno/manipulado | `BLOCKED`; `app/teacher/classes/[classId]/page.tsx` |
| 16 | `/teacher/assignments` | Tareas globales / TEACHER (ADMIN admitido por gate) | workspaces asignados | buscar/filtrar, crear tarea, descargar adjunto, abrir clase | CLASSROOM-T | adjuntos, fecha, publicación | `BLOCKED`; `TeacherAssignmentsPage.tsx` |
| 17 | `/teacher/calendar` | Calendario / TEACHER (ADMIN admitido por gate) | clases, bookings, eventos | navegar mes, filtrar, crear evento, abrir clase | SCHEDULE-T, CAL | evento inválido, mes sin eventos | `BLOCKED`; `TeacherCalendarPage.tsx` |
| 18 | `/teacher/files` | Materiales / TEACHER (ADMIN admitido por gate) | workspaces/materiales | buscar/filtrar, subir/enlazar, descargar, eliminar | CLASSROOM-T | archivo vs URL, límite/tipo/storage, confirmación de borrado | `BLOCKED`; `TeacherFilesPage.tsx` |
| 19 | `/teacher/gcr` | Goal Check Report / TEACHER | fecha, clase y Student asignados | filtrar, semana, abrir borrador, asistencia/tareas/verso/méritos/deméritos, guardar/enviar | GCR | query `date,classId,studentId`; missingFields, 409, 10:00, post-cierre, versión | `BLOCKED`; `GcrTeacherPage.tsx`, `GcrEditorDialog.tsx` |
| 20 | `/teacher/grades` | Calificación PACE / TEACHER (ADMIN admitido por gate) | registros calificables | buscar/filtrar, crear/editar nota y feedback | PACE-T | nota inválida, registro ajeno | `BLOCKED`; `TeacherGradesPage.tsx` |
| 21 | `/teacher/meetings` | Alias reuniones / TEACHER* | ninguno | redirigir a horario | ninguno | redirect | `PASS` estático; **redirect ocurre antes del gate**, `app/teacher/meetings/page.tsx` |
| 22 | `/teacher/messages` | Mensajes / TEACHER (ADMIN admitido por gate) | conversaciones/contactos | crear, enviar, paginar, editar, borrar, escalar | MSG | conversación ajena, cursor inválido, Director | `BLOCKED`; `TeacherMessagesPage.tsx`, `ConversationWorkspace.tsx` |
| 23 | `/teacher/notifications` | Notificaciones / TEACHER (ADMIN admitido por gate) | notificaciones propias | listar, marcar leída | NOTIF | lista vacía, ID ajeno | `BLOCKED`; `NotificationsPage.tsx` |
| 24 | `/teacher/paces` | Seguimiento PACE / TEACHER (ADMIN admitido por gate) | workspace PACE | filtrar, reconciliar, cambiar estado, calificar | PACE-T | sin período, registros faltantes, registro ajeno | `BLOCKED`; `TeacherPacesPage.tsx` |
| 25 | `/teacher/schedule` | Horario/solicitudes / TEACHER (ADMIN admitido por gate) | horario, clases, disponibilidad, bookings | crear/editar/desactivar slot, aprobar/rechazar/reprogramar | SCHEDULE-T | colisión, fecha pasada, sin disponibilidad | `BLOCKED`; `TeacherSchedulePage.tsx` |
| 26 | `/student/dashboard` | Inicio / STUDENT (ADMIN admitido por gate) | resumen + workspaces propios | abrir tareas/clases/PACEs/mensajes/horario | SCHEDULE-S, CLASSROOM-S | sin clases/tareas | `BLOCKED`; `StudentDashboardV1.tsx` |
| 27 | `/student/classes` | Mis clases / STUDENT (ADMIN admitido por gate) | matrículas propias | buscar/filtrar, abrir clase | CLASSROOM-S | lista vacía | `BLOCKED`; `StudentClassesPage.tsx` |
| 28 | `/student/classes/[classId]` | Workspace clase / STUDENT (ADMIN admitido por gate) | `classId`, matrícula propia | muro/comentarios, ver tareas/materiales/PACEs, entregar/eliminar adjunto/descargar | CLASSROOM-S | `tab=wall|paces|assignments|resources`; ID ajeno, material oculto | `BLOCKED`; `app/student/classes/[classId]/page.tsx` |
| 29 | `/student/assignments` | Tareas globales / STUDENT (ADMIN admitido por gate) | workspaces propios | buscar/filtrar, abrir tarea/clase | CLASSROOM-S | vencida, enviada, calificada | `BLOCKED`; `StudentAssignmentsPage.tsx` |
| 30 | `/student/calendar` | Calendario / STUDENT (ADMIN admitido por gate) | bookings y eventos; demo opcional | navegar mes, filtrar, abrir clase | SCHEDULE-S, CAL + posible data mock | mezcla real/demo según flag | `BLOCKED`; `StudentCalendarPage.tsx` |
| 31 | `/student/files` | Materiales visibles / STUDENT (ADMIN admitido por gate) | workspaces propios | buscar/filtrar, descargar/abrir enlace | CLASSROOM-S | material oculto, archivo inexistente | `BLOCKED`; `StudentFilesPage.tsx` |
| 32 | `/student/grades` | Mis notas / STUDENT (ADMIN admitido por gate) | notas propias | buscar/filtrar/ver feedback | PACE-S | sin notas, pertenencia | `BLOCKED`; `StudentGradesPage.tsx` |
| 33 | `/student/meetings` | Alias reuniones / STUDENT* | ninguno | redirigir a horario | ninguno | redirect | `PASS` estático; **redirect ocurre antes del gate**, `app/student/meetings/page.tsx` |
| 34 | `/student/messages` | Mensajes / STUDENT (ADMIN admitido por gate) | conversaciones/contactos | crear, enviar, paginar, editar, borrar, escalar | MSG | conversación ajena, contacto no asignado | `BLOCKED`; `StudentMessagesPage.tsx`, `ConversationWorkspace.tsx` |
| 35 | `/student/notifications` | Notificaciones / STUDENT (ADMIN admitido por gate) | notificaciones propias | listar, marcar leída | NOTIF | lista vacía, ID ajeno | `BLOCKED`; `NotificationsPage.tsx` |
| 36 | `/student/paces` | Mis PACEs / STUDENT (ADMIN admitido por gate) | PACEs propios | ver/filtrar progreso | PACE-S | sin registros, pertenencia | `BLOCKED`; `StudentPacesPage.tsx` |
| 37 | `/student/schedule` | Horario/encuentros / STUDENT (ADMIN admitido por gate) | horario, bookings, disponibilidad | ver horario, seleccionar slot/fecha, reservar/cancelar | SCHEDULE-S | duplicado, fecha pasada, slot agotado | `BLOCKED`; `StudentSchedulePage.tsx` |

## Matriz de navegación y redirecciones

| Superficie | Enlaces expuestos | Rutas existentes no enlazadas |
| --- | --- | --- |
| Legado | `/dashboard`, `/groups`, `/calendar`, `/admin`, `/` | `/login` (alias) |
| Admin | `/admin`, `/admin/users`, `/admin/classes`, `/admin/schedules`, `/admin/families`, `/admin/paces`, `/admin/settings` | ninguna |
| Teacher | dashboard, classes, gcr, schedule, paces, grades, messages, assignments, calendar, files, notifications | `/teacher/meetings` (alias legado) |
| Student | dashboard, classes, schedule, paces, grades, assignments, calendar, files, messages, notifications | `/student/meetings` (alias legado) |
| Parent | ninguna | no existe `/parent` |
| Director | ninguna | no existe `/director` |

Redirecciones internas adicionales:

- Login exitoso usa `getDefaultPortalPath()`: prioridad ADMIN → DIRECTOR → TEACHER → PARENT → STUDENT.
- El GCR sincroniza `date`, `classId` y `studentId` en la URL con `router.replace`.
- Los workspaces de clase aceptan `tab`; un valor inválido vuelve a `wall`.
- Links de tareas/calendario profundizan a `/teacher|student/classes/:id` y, para tareas, `?tab=assignments`.
- Fallo de `/auth/me` o rol incorrecto ejecuta `router.replace("/")`.

## Autenticación y autorización observadas

### Controles existentes

1. `POST /auth/login` valida email sin distinguir mayúsculas, usuario activo y hash bcrypt; credenciales inválidas/inactivo devuelven 401 genérico.
2. JWT se guarda en cookie HTTP-only, `SameSite=Lax`, `Secure` en producción, path `/`, duración de cookie 24 h.
3. `JwtStrategy` acepta cookie o Bearer, valida expiración y vuelve a consultar usuario activo y roles en cada petición.
4. Cada portal web usa `PortalAuthGate`, llama `/auth/me` y compara roles.
5. API usa guards de JWT, roles y/o permisos; servicios revisados verifican clase asignada, matrícula, autoría/participación y archivos ocultos.
6. Descargas de materiales/entregas pasan por endpoints autenticados y los servicios ocultan recursos no autorizados con 404 cuando corresponde.

### Cruces de rol que deben automatizarse

| Sesión | Destino | Expectativa |
| --- | --- | --- |
| Sin sesión | cualquier `/admin/**`, `/teacher/**`, `/student/**` funcional | redirige a `/`; API 401; sin fuga de contenido |
| STUDENT | `/teacher/**`, `/admin/**` | redirige a `/`; API 403 |
| TEACHER | `/student/**`, `/admin/**` | redirige a `/`; API 403 |
| PARENT | Admin/Teacher/Student | redirige a `/`; conversación solo si vínculo/permiso válido |
| DIRECTOR | Admin/Teacher/Student | redirige a `/`; solo conversaciones escaladas/permitidas |
| TEACHER | clase/GCR/entrega/archivo de otro Teacher | 403 o 404 sin metadatos ajenos |
| STUDENT | clase/entrega/archivo/conversación ajena o material oculto | 403/404 sin datos ajenos |
| ADMIN | portales Teacher/Student | comportamiento debe definirse y hacerse coherente con API (hoy es inconsistente) |

## Gaps y defectos candidatos

### P1 — AUTH-GAP-01: Parent y Director inician sesión hacia rutas inexistentes

- `portalBaseRoutes` define `/parent` y `/director`, pero no existe ningún `page.tsx` bajo esos segmentos.
- Usuario exclusivamente PARENT o DIRECTOR recibe navegación a 404 después de login correcto.
- Clasificación funcional: los portales Parent/Director son `AUSENTE/PLANIFICADO`, pero el redirect de login sí es un defecto de experiencia/autenticación.
- Evidencia: `packages/shared/src/permissions.ts:90-93`, ausencia confirmada en los 37 `page.tsx`.

### P1/P2 — AUTH-GAP-02: ADMIN pasa el gate web Teacher/Student pero varias APIs lo rechazan

- `canAccessPortal()` permite ADMIN para cualquier portal.
- Controladores de horarios Teacher/Student, GCR y listados Classroom Teacher/Student requieren exclusivamente el rol del portal.
- Resultado probable: ADMIN abre la ruta, luego ve error/estado vacío por 403. PACEs, conversaciones y algunos endpoints Classroom sí admiten ADMIN, por lo que el comportamiento es inconsistente por pantalla.
- Definir política: o ADMIN tiene modo impersonación/consulta explícito y todos los endpoints lo soportan de forma segura, o el gate no debe admitir ADMIN en esos portales.
- Evidencia: `packages/shared/src/permissions.ts:113-115`; `schedules.controller.ts`, `gcr.controller.ts`, `classroom.controller.ts`.

### P2 — AUTH-GAP-03: protección web exclusivamente client-side y pantalla en blanco durante verificación

- No hay middleware, layouts protegidos server-side ni loading route.
- `PortalAuthGate` inicialmente retorna `null`; cada navegación protegida monta JS, llama `/auth/me` y luego decide.
- Riesgos: flash/pantalla blanca, redirección tardía, `/auth/me` repetido por navegación y dependencia total de hidratación. La API evita la fuga de datos, pero la UX y la regresión de acceso requieren E2E.
- Evidencia: `components/auth/portal-auth-gate.tsx`, ausencia de `middleware.ts` y `loading.tsx`.

### P2 — AUTH-GAP-04: logout navega antes de confirmar que la cookie fue eliminada

- `clearSession()` dispara `fetch('/auth/logout')` sin esperar y el Link navega inmediatamente a `/`.
- Una recarga/acceso directo rápido puede competir con el borrado de cookie. No se muestra error si logout falla.
- Reproducir con red lenta/offline antes de clasificar definitivamente.
- Evidencia: `apps/web/lib/session.ts:25-33`, shells de portal.

### P2 — ROUTE-GAP-01: tres rutas legado son públicas y parecen parte de la plataforma

- `/dashboard`, `/groups` y `/calendar` no tienen gate, usan contenido placeholder y enlazan `/admin`.
- No exponen datos por sí mismas, pero crean superficie no clasificada para usuarios y crawlers y contradicen la navegación por rol.
- Estado: `NOT_IMPLEMENTED`; decidir retiro/redirect/protección, sin contarlo como funcionalidad release.

### P2 — ROUTE-GAP-02: redirects `/teacher/meetings` y `/student/meetings` no autentican antes de redirigir

- Son Server Components con `redirect()` y no usan el shell/gate.
- Un visitante anónimo termina en `/teacher|student/schedule`, donde recién se valida la sesión. No hay fuga de datos; sí una navegación adicional evitable.

### P2 — DATA-GAP-01: calendario Student puede mezclar datos demo con API real

- `StudentCalendarPage` importa `mock-student-data` y `student-learning-data`; cuando `NEXT_PUBLIC_ENABLE_DEMO_DATA` está activo, agrega eventos demo a bookings/eventos reales.
- Debe verificarse que staging/producción tengan el flag desactivado y que la suite lo detecte; una UI que mezcla mocks con persistencia real no puede marcarse PASS.
- Evidencia: `features/student/calendar/StudentCalendarPage.tsx:6-18`.

### P3 — UX/A11Y-GAP-01: estados de autenticación no se anuncian completamente

- El error de login no tiene `aria-live`/`role=alert`.
- El gate no ofrece nombre/estado de carga accesible.
- Admin search del shell carece de nombre/label y es visualmente una acción global aunque no se detectó lógica conectada.
- Se requiere recorrido de teclado/foco y axe antes de ampliar la clasificación.

### P3 — PERF-GAP-01: carga de clases produce patrón N+1 HTTP en varias pantallas

- `teacherWorkspaces()`/`studentWorkspaces()` primero obtiene lista y luego hace una petición workspace por clase mediante `Promise.all`.
- Dashboards, tareas y archivos repiten ese patrón al montar. No se propone optimización sin medir, pero debe instrumentarse número de requests/payload/p95.
- Evidencia: `features/classroom/classroom-api.ts:7-13`.

### P3 — RELIABILITY-GAP-01: Notifications no captura errores

- `load()` y `markRead()` esperan API sin `catch`; un 401/500 o fallo de red puede generar rechazo no manejado y dejar “Cargando…” indefinidamente.
- Revisar consola durante recorridos Teacher y Student.

## Estados, modales y formularios a cubrir

- **Admin:** diálogos crear usuario/clase/vínculo/materia; formularios de año/término/grado/plantilla; toggles de permisos familiares; edición/publicación de horario.
- **Teacher:** modal tarea, modal material, visor/calificador de entregas, calendario create dialog, GCR full-screen + méritos/deméritos/post-cierre/conflicto, modal calificación PACE, disponibilidad y reprogramación, workspace conversación.
- **Student:** entrega con varios adjuntos y eliminación individual, reserva/cancelación, workspace conversación; filtros/empty states en clases/tareas/materiales/notas/PACEs/calendario.
- **Comunes:** sidebar responsive, logout, filtros, estados skeleton/error/empty, links de download, diálogos Escape/restauración de foco, navegación atrás y recarga.

## Datos mínimos para ejecutar estas rutas

- Usuarios activos independientes: ADMIN, TEACHER A/B, STUDENT A/B, PARENT y DIRECTOR; además usuarios inactivos y multirol.
- Año activo con términos, niveles/grados, dos clases, materias y horarios publicados.
- Teacher A asignado solo a clase A; Teacher B solo a B. Student A matriculado solo en A; Student B solo en B.
- Vínculo Parent–Student con combinaciones de permisos.
- Tareas publicadas/borrador, entregas propias/ajenas, materiales visibles/ocultos y archivos locales de prueba.
- Conversaciones propias/ajenas y una escalada.
- Disponibilidad/bookings, PACEs/notas y notificaciones por usuario.
- GCR vacío/completo/post-cierre con versión apta para provocar 409.

## Resultado de esta fase parcial

El inventario de archivos/rutas está completo: **37/37 clasificadas**. La validación funcional permanece deliberadamente `BLOCKED` salvo redirects estáticamente verificables y placeholders `NOT_IMPLEMENTED`, porque no se usó entorno integrado, navegador ni base de pruebas en esta tarea parcial.

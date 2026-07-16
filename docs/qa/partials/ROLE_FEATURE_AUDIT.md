# Auditoría parcial de funcionalidades por rol

Fecha de revisión estática: 2026-07-12  
Alcance: Admin, Teacher, Student, Director y Parent.  
Método: trazado de ruta activa → componente visible → cliente API → controlador/servicio → modelo Prisma. No se ejecutó navegador ni se modificó la aplicación. Los hallazgos son candidatos que requieren reproducción E2E antes de consolidarse como defectos confirmados.

## Criterio de clasificación

- **IMPLEMENTADO:** la superficie activa usa API y persistencia real para su flujo principal.
- **PARCIAL:** existe una superficie útil, pero conserva acciones locales, controles sin operación, cobertura incompleta o estados de error no resueltos.
- **PLANIFICADO:** está descrito como fase futura y no debe registrarse como bug por su sola ausencia.
- **AUSENTE:** no hay superficie ni compromiso explícito identificado para el release actual.

## Resumen por rol

| Rol | Estado global | Evidencia principal |
| --- | --- | --- |
| Admin | PARCIAL | Años/períodos, usuarios, clases, materias/PACEs, familias y horarios llaman API real. Edición de usuario es una acción visible sin implementación; no existe edición/asignación posterior de roles y el teacher primario no se configura desde la UI. |
| Teacher | PARCIAL | Dashboard, clases, muro, tareas, entregas/calificación, materiales, mensajes, horarios, calendario, PACEs, notas y GCR usan API real. La pestaña `schedule` dentro del detalle de clase sigue siendo estado local, aunque `/teacher/schedule` sí es persistente. |
| Student | PARCIAL | Dashboard, clases, muro, tareas/entregas, archivos, mensajes, horario, reservas, PACEs y notas usan API real. La pantalla activa de horario no expone cancelación y el calendario omite tareas/clases reales cuando demo data está desactivada. |
| Director | PLANIFICADO | Rol, perfil, permisos teóricos y participación en conversaciones escaladas existen; no hay `apps/web/app/director/**` ni consola propia. GCR Dirección/Admin está expresamente planificado. |
| Parent | PLANIFICADO | Perfil, vínculo familiar y permisos teóricos existen; no hay `apps/web/app/parent/**` ni endpoints académicos completos/superficie propia. GCR Student/Parent está expresamente fuera del MVP. |

## Admin

| Área | Estado | Persistencia/evidencia | Gaps y casos QA prioritarios |
| --- | --- | --- | --- |
| Dashboard | IMPLEMENTADO | `AdminDashboardPage.tsx:19` carga overview y clases mediante API. | Validar estados vacío/error y conteos tras mutaciones. |
| Usuarios y creación por rol | PARCIAL | `AdminUsersPage.tsx:22`, `:63` consultan/crean usuarios reales; backend crea perfiles Teacher/Student/Parent/Director. | `AdminUsersPage.tsx:129` muestra **Editar** sin handler. No existe API web para actualizar usuario, activar/desactivar o modificar roles. Fallos de creación no se capturan ni se muestran inline (`:46-66`). |
| Años y períodos | IMPLEMENTADO | `AdminSettingsPage.tsx:16`, `:33`, `:46`, `:54` usan endpoints reales. | Acciones carecen de busy/error inline. `AdminSettingsPage.tsx:103` usa `span onClick` anidado en un botón: inaccesible por teclado y HTML interactivo ambiguo. |
| Clases | IMPLEMENTADO | `AdminClassesPage.tsx:32`, `:64`, `:69`, `:74`, `:82` leen y escriben mediante API. Backend usa `upsert` para docente, matrícula y materia. | No hay desasignación/baja. Los errores de pertenencia/duplicado/red no se capturan. |
| Asignación de teacher | PARCIAL | API admite `isPrimary`; `admin-academics.service.ts` persiste el valor mediante `ClassTeacher.upsert`. | `AdminClassesPage.tsx:64` nunca envía `isPrimary`; la UI no permite elegir/cambiar responsable principal, dato requerido para cumplimiento GCR futuro. |
| Matrículas | IMPLEMENTADO | `enrollAdminClassStudent` y `ClassEnrollment.upsert` persisten/reactivan matrícula. | No hay baja/cambio de estado en UI; validar incompatibilidad de grado y mensaje mostrado. |
| Materias y PACEs | IMPLEMENTADO | `AdminPacesPage.tsx:42`, `:47`, `:60` actualizan materias y catálogo PACE. | No hay eliminación; probar límites y errores de numeración. |
| Familias | IMPLEMENTADO | `AdminFamiliesPage.tsx:43`, `:61` crean vínculo y cambian permisos reales. | Mutaciones sin busy ni catch; doble clic y 4xx pueden dejar error no explicado. |
| Horarios | IMPLEMENTADO | `AdminSchedulesPage.tsx:35`, `:58`, `:63`, `:71`, `:72`, `:78` operan grilla/plantillas/publicación reales. | Guardado combina asignaciones concurrentes y bloques; validar error parcial y consistencia si una promesa falla. |
| Configuración general | PARCIAL | La ruta `/admin/settings` solo cubre año/período. | El nombre “Configuración” no equivale a configuración institucional completa; no inventariar correo, backups, storage o reglas como implementadas. |

## Teacher

| Área | Estado | Persistencia/evidencia | Gaps y casos QA prioritarios |
| --- | --- | --- | --- |
| Dashboard | IMPLEMENTADO | `TeacherDashboardV1.tsx:41` obtiene resumen y workspaces reales en paralelo. | Riesgo de payload: descarga workspaces completos para métricas; medir antes de optimizar. |
| Listado/detalle de clases | IMPLEMENTADO | `TeacherClassesPage.tsx` y `TeacherClassWorkspacePage.tsx` usan `classroomApi`; pertenencia se valida en API. | Probar IDs ajenos, vacío y API caída. |
| Muro y comentarios | IMPLEMENTADO | `TeacherClassWorkspacePage.tsx:60` y `ClassroomWall` llaman endpoints persistentes. | Validar doble clic, error de API y contenido largo; no todos los iconos decorativos tienen `aria-hidden`. |
| Tareas, adjuntos, entregas y calificación | IMPLEMENTADO | Creación `TeacherClassWorkspacePage.tsx:65`; entregas/calificación `ClassAssignments.tsx:164`, `:274`; archivos por endpoints autenticados. | Validar storage local de test, descarga ajena, múltiples adjuntos, doble envío y eliminación. |
| Materiales/archivos | PARCIAL | Carga/borrado real (`TeacherFilesPage.tsx:51`, `:309`). | Persistencia existe, pero MIME/antivirus/cuota siguen fuera; endpoint genérico `/files` no representa este flujo. |
| Mensajería | IMPLEMENTADO | Conversaciones, paginación de 30 mensajes, envío, edición, borrado y escalamiento usan API. | Validar pertenencia, cursor, edición ajena y ausencia de Director activo. |
| Horario/disponibilidad principal | IMPLEMENTADO | `/teacher/schedule` carga/actualiza disponibilidad y bookings (`TeacherSchedulePage.tsx:42-77`, `:364-372`, `:562`). | Validar colisiones, doble clic, 409 y reprogramación. |
| Pestaña Horario dentro de clase | PARCIAL | `workspace-mappers.ts:86-93` fabrica horario vacío; `ClassDetailPage.tsx:66-70`, `:235-240` solo actualiza `useState`. Se muestra aviso de no persistencia en `:207-210`. | Aun con aviso, botones dicen aceptar/rechazar/notificar y producen actividad local. Es una segunda UI contradictoria frente a `/teacher/schedule`. |
| Calendario | PARCIAL | Lectura y creación real (`TeacherCalendarPage.tsx:56`, `:88`, `:111`). | No hay edición, borrado ni recurrencia. |
| PACEs y calificaciones | IMPLEMENTADO | `TeacherPacesPage.tsx:34`, `:106`, `:112`, `:272` y `TeacherGradesPage.tsx:21`, `:139-140` usan API real. | `reconcile` escribe desde acción explícita; medir, no mover ni cachear sin evidencia. |
| GCR Teacher | IMPLEMENTADO | Filtros/semana/open/draft/attendance/tasks/verse/merit/demerit/submit usan `gcrApi`; versión, 409, missingFields y post-close están modelados. | Requiere E2E completo; no equivale a PASS por inspección estática. |
| Notificaciones | PARCIAL | Lista y marcado como leído persisten (`NotificationsPage.tsx:8-10`). | Sin busy/error por elemento ni disparadores institucionales completos. |

## Student

| Área | Estado | Persistencia/evidencia | Gaps y casos QA prioritarios |
| --- | --- | --- | --- |
| Dashboard | IMPLEMENTADO | `StudentDashboardV1.tsx:40` obtiene summary y workspaces reales. | Riesgo de payload completo similar al Teacher; medir. |
| Clases y detalle | IMPLEMENTADO | `StudentClassesPage`/`StudentClassWorkspacePage` usan `classroomApi`; el servidor valida matrícula. | Probar clase ajena y deep-links de tabs. |
| Muro y comentarios | IMPLEMENTADO | `StudentClassWorkspacePage.tsx:185`, `:192` persisten. | Acciones no tienen busy/catch visible; icon button de comentario en torno a `:252` necesita nombre accesible. |
| Tareas y entregas | IMPLEMENTADO | Submit y adjuntos llaman API (`StudentClassWorkspacePage.tsx:314-319`); admite hasta 5 archivos y eliminación propia. | Probar entrega calificada, adjunto ajeno, reload y storage local. |
| Materiales y archivos | IMPLEMENTADO | Workspace y `/student/files` exponen materiales autorizados/descargas autenticadas. | Validar materiales ocultos y URLs externas. |
| Mensajería | IMPLEMENTADO | Usa el mismo workspace persistente y controlado por participantes. | Probar conversación ajena/manipulación de ID. |
| Horario y solicitud presencial | PARCIAL | Consulta horario, disponibilidad y reserva real (`StudentSchedulePage.tsx:29`, `:43`, `:50`). | API ofrece `PATCH /student/schedules/bookings/:id/cancel`, pero la pantalla activa solo lista estado (`StudentSchedulePage.tsx:101-128`) y no expone cancelar. `/student/meetings` redirige al horario, por lo que el flujo de cancelación quedó inaccesible. |
| Calendario | PARCIAL | Bookings y eventos generales son reales (`StudentCalendarPage.tsx:22-23`). | Tareas/clases provienen exclusivamente de `getStudentCalendarEvents()` bajo `NEXT_PUBLIC_ENABLE_DEMO_DATA` (`:18`); con demo off, el filtro de clases también queda vacío (`:60`) y el calendario no cumple su texto “Tareas, clases y encuentros”. |
| PACEs y calificaciones | IMPLEMENTADO | `StudentPacesPage.tsx:15` y `StudentGradesPage.tsx:19` usan endpoints propios. | Validar que solo devuelvan perfil propio. |
| Notificaciones | PARCIAL | Persistencia de lectura real. | No hay email/push ni cobertura completa de eventos. |
| GCR | PLANIFICADO/NO APLICABLE AL MVP | `docs/GCR_SPEC.md` excluye Student y Parent de la primera implementación. | No registrar ausencia como bug del release actual. |

## Director y Parent

| Capacidad | Director | Parent | Clasificación/evidencia |
| --- | --- | --- | --- |
| Rol, perfil y permisos compartidos | Sí | Sí | IMPLEMENTADO como base (`packages/shared/src/permissions.ts`, perfiles Prisma). |
| Creación desde Admin | Sí | Sí | IMPLEMENTADO (`AdminUsersPage.tsx:160-170`; servicio crea perfil específico). |
| Portal web | No | No | PLANIFICADO. No existen `apps/web/app/director/**` ni `apps/web/app/parent/**`. |
| Académicos propios | No | No | PLANIFICADO/PARCIAL según inventario técnico; no hay endpoints completos específicos. |
| Mensajería | Backend admite Director/Parent | Backend admite Director/Parent | PARCIAL: servicio/roles existen, pero no hay superficie web de esos roles. |
| Escalamiento | Director se añade a conversación escalada | N/A | PARCIAL: backend implementado; falta consola Director. |
| GCR cumplimiento/exportación | No | Fuera de MVP | PLANIFICADO, no bug por ausencia. |

## Bugs candidatos

### QA-ROLE-001 — “Editar” usuario no ejecuta ninguna acción

- Severidad candidata: **P2**.
- Rol/ruta: ADMIN, `/admin/users`.
- Evidencia: `apps/web/features/admin/users/AdminUsersPage.tsx:129` renderiza un botón sin `onClick`, enlace ni estado; `admin-api.ts` no ofrece update de usuario/rol/estado.
- Resultado esperado: abrir edición real o no mostrar una acción disponible.
- Riesgo: administración aparenta soportar edición, pero no permite corregir cuenta, rol o estado.

### QA-ROLE-002 — Horario embebido de clase confirma cambios que no persisten

- Severidad candidata: **P2**.
- Rol/ruta: TEACHER, `/teacher/classes/:classId?tab=schedule`.
- Evidencia: `workspace-mappers.ts:86-93` crea datos sintéticos vacíos; `ClassDetailPage.tsx:66-70` almacena en estado local; `:235-240` solo llama setters. `ClassSchedule.tsx` genera actividad y textos de notificación sin API.
- Resultado esperado: redirigir al horario persistente o deshabilitar completamente las mutaciones locales.
- Nota: el aviso `ClassDetailPage.tsx:207-210` reduce el engaño, pero no impide usar acciones que aparentan aceptar/rechazar/notificar.

### QA-ROLE-003 — Student no puede cancelar una solicitud desde la ruta activa

- Severidad candidata: **P2**.
- Rol/ruta: STUDENT, `/student/schedule`.
- Evidencia: backend y `schedule-api.ts` tienen cancelación; `StudentSchedulePage.tsx:101-128` solo lista booking/estado. `/student/meetings` redirige a `/student/schedule`.
- Resultado esperado: solicitud cancelable cuando las reglas de negocio lo permiten, con respuesta real de API.

### QA-ROLE-004 — Calendario Student pierde tareas y clases al desactivar demo data

- Severidad candidata: **P2**.
- Rol/ruta: STUDENT, `/student/calendar`.
- Evidencia: `StudentCalendarPage.tsx:18` obtiene tareas/clases solo de datos demo; `:22-23` agrega bookings/eventos generales, y `:60` deja vacío el filtro de clases en configuración normal.
- Resultado esperado: derivar tareas y clases de endpoints reales o ajustar alcance/copy.

### QA-ROLE-005 — Login de Director/Parent conduce a rutas inexistentes

- Severidad candidata: **P2**, condicionada a que se permitan esas cuentas en el release.
- Rol/ruta: DIRECTOR/PARENT, login → `/director` o `/parent`.
- Evidencia: `packages/shared/src/permissions.ts:89-120` define destinos; `login-card.tsx:30-31` navega al destino; Admin permite crear ambos roles; no hay rutas web correspondientes.
- Resultado esperado: mientras los portales sean planificados, no ofrecer acceso o mostrar una página explícita de “no disponible”, no un 404.
- Clasificación: la ausencia del portal no es bug por sí sola; sí lo es el recorrido activo que envía al usuario a una ruta inexistente.

### QA-ROLE-006 — Buscador global Admin no tiene comportamiento

- Severidad candidata: **P3**.
- Rol/ruta: ADMIN, todas las rutas.
- Evidencia: `AdminPortalShell.tsx:134-141` muestra input “Buscar usuario, clase o alumno” sin value, onChange, submit, navegación ni resultado.
- Resultado esperado: implementar búsqueda o retirar el control hasta que exista.

### QA-ROLE-007 — Mutaciones Admin no presentan errores de API ni bloquean repetición

- Severidad candidata: **P2**.
- Rol/rutas: `/admin/users`, `/admin/classes`, `/admin/families`, `/admin/settings`, `/admin/paces`.
- Evidencia: funciones async esperan API directamente (por ejemplo `AdminUsersPage.tsx:46-66`, `AdminClassesPage.tsx:61-88`, `AdminFamiliesPage.tsx:38-62`) sin try/catch, estado submitting ni error inline.
- Resultado esperado: no confirmar éxito antes de API; bloquear solo durante request y mostrar el error real con próximo paso.

### QA-ROLE-008 — Control “Activar” no es accesible por teclado

- Severidad candidata: **P3**.
- Rol/ruta: ADMIN, `/admin/settings`.
- Evidencia: `AdminSettingsPage.tsx:92-105` anida un `span onClick` dentro de un `button`.
- Resultado esperado: controles semánticos independientes; teclado/foco sin interacción anidada.

### QA-ROLE-009 — Modales propios no garantizan Escape ni retorno de foco

- Severidad candidata: **P3**.
- Roles/rutas: varias pantallas Admin/Teacher/Student.
- Evidencia representativa: `AdminUsersPage.tsx:141+`, `TeacherGradesPage.tsx:150+` y diálogos de schedule usan overlays propios sin manejador Escape/gestión de foco consistente; algunos tampoco declaran `role="dialog"`/`aria-modal`.
- Resultado esperado: Escape cierra, foco queda atrapado mientras abre y vuelve al disparador al cerrar.

## Hallazgos de rendimiento (riesgos, no bugs confirmados)

1. `TeacherDashboardV1.tsx:41` y `StudentDashboardV1.tsx:40` descargan todos los workspaces completos para calcular conteos y actividad. Con muchas clases, posts, tareas, entregas y materiales puede crecer el payload inicial. Medir tamaño/p95 antes de introducir caché; preferir summary dedicado si los datos lo justifican.
2. `AdminClassesPage.tsx:32` carga clases completas, todos los usuarios, materias, años y grados en paralelo. Evita waterfall, pero no hay paginación/búsqueda servidor; medir con volumen institucional.
3. No cachear permisos, notas, entregas, reservas, conversaciones ni GCR. Los clientes actuales actualizan desde respuesta API, lo cual es correcto para consistencia.

## Observaciones de interfaz/accesibilidad

- El código activo usa roles accesibles y labels en varias áreas, pero quedan icon-buttons sin nombre accesible y overlays sin contrato uniforme.
- Formularios propios carecen frecuentemente de `name`/`autocomplete` y errores junto al campo; verificar con axe y teclado.
- Varios placeholders usan `...` en vez de `…`; impacto P4/P3 visual, no funcional.
- La mayoría de fechas nuevas usa `Intl.DateTimeFormat`; conservar este patrón y evitar `toLocaleString` sin zona explícita en datos de negocio.

## Casos E2E mínimos derivados

1. Admin crea cada rol; verifica persistencia tras recarga y comportamiento de login por rol.
2. Admin intenta editar usuario y cambiar estado/rol; debe quedar FAIL si el botón continúa inerte.
3. Admin asigna docente, estudiante y materia; recarga y verifica DB/UI; fuerza 4xx/409 para comprobar mensaje.
4. Teacher modifica la pestaña horario dentro de clase, recarga y contrasta con `/teacher/schedule`.
5. Student crea booking y luego intenta cancelarlo desde la única ruta alcanzable.
6. Student con demo data desactivada y tarea real verifica aparición en calendario.
7. Teacher/Student ejecutan muro, tarea, entrega, material, mensaje, PACE, nota y GCR; cada acción debe sobrevivir refresh.
8. Teclado: abrir/cerrar cada diálogo con Escape, comprobar foco de retorno y nombre accesible de icon-buttons.

## Límites

- No se ejecutaron pruebas contra base de datos ni navegador en este parcial.
- No se afirma PASS/FAIL definitivo; los estados describen implementación observada y los bugs son candidatos reproducibles.
- No se modificó aplicación, API, Prisma, migraciones ni tests.

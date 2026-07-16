# Especificación funcional y técnica — Goal Check Report (GCR)

**Estado:** propuesta para aprobación  
**Fase:** 0 — documentación y análisis  
**Fecha:** 2026-07-07  
**Zona horaria provisional:** `America/Panama`

> Este documento no autoriza cambios de código, esquema, migraciones, endpoints, frontend, backend, seed, storage, autenticación ni permisos. Las entidades, rutas y permisos aquí descritos son propuestas para fases posteriores.

## 1. Resumen del módulo

Goal Check Report (GCR) será el registro diario, por estudiante y clase, del seguimiento académico y conductual. Reunirá asistencia, tareas por materia, versículo, méritos, deméritos, comentarios, estado de envío y auditoría. La persistencia propuesta es diaria; la vista semanal será una proyección de cinco reportes diarios, no un documento semanal independiente.

El MVP tendrá 2 superficies: captura para Teacher y cumplimiento/evidencia para Directora/Admin. Student no participará en la primera implementación.

## 2. Objetivo institucional y relación con certificación

El módulo debe producir evidencia verificable de que cada GCR esperado fue completado, por quién, cuándo, con qué contenido y qué cambió después. Debe distinguir ausencia de reporte, borrador, envío oportuno, envío tardío, incompletitud y modificación posterior al cierre. La evidencia debe ser reproducible desde datos persistidos y no depender del estado del navegador.

## 3. Estado actual observado y compatibilidad

El GCR externo de referencia filtra fecha, clase/grado, sección y estudiante, y luego presenta una semana con materias, versículo, tareas, asistencia, méritos, deméritos y comentarios.

La revisión limitada del proyecto actual confirma:

- Roles existentes: `ADMIN`, `TEACHER`, `STUDENT`, `PARENT`, `DIRECTOR`.
- `User` se relaciona 1:1 con perfiles de Student, Teacher y Director.
- `AcademicClass` pertenece a un año académico y opcionalmente a `GradeLevel`.
- `ClassEnrollment` identifica estudiantes matriculados y tiene estado; el GCR debe usar solo `ACTIVE`.
- `ClassTeacher.isPrimary` y `ClassSubjectTeacher` representan asignaciones docentes.
- `ClassSubject` vincula clase y `Subject`; `Subject.shortName` ya resuelve las siglas configurables.
- `AcademicTerm` aporta inicio, fin, orden y estado activo.
- PACEs y notas ya enlazan estudiante, materia de clase y trimestre, pero no deben reutilizarse como GCR.
- Existen guards por rol y permiso, más validaciones de pertenencia en servicios.
- No se observó una entidad formal `Section`. No debe agregarse ni simularse antes de decidir su significado.
- Los permisos actuales no incluyen permisos específicos de GCR.

## 4. Roles y permisos

### Teacher

Podrá consultar y editar únicamente GCR de matrículas activas en clases que le estén asignadas. Para el MVP se propone que el responsable de cumplimiento sea `ClassTeacher.isPrimary = true`; un docente asignado solo a una materia podrá registrar datos de su materia únicamente si la institución aprueba esa colaboración. No se debe inferir acceso por conocer identificadores: cada lectura y escritura debe validar asignación en servidor.

Acciones propuestas: ver filtros autorizados, leer semana, guardar borrador, enviar, registrar eventos y corregir según reglas de cierre.

### Directora/Admin

Podrán consultar todos los GCR, cumplimiento y auditoría; exportar evidencia; y, si se aprueba, corregir o autorizar correcciones. `ADMIN` no debe tratarse como un Teacher arbitrario para operaciones de captura.

### Student

Sin acceso en el MVP. Una vista futura sería solo lectura y limitada al propio estudiante. Parent también queda fuera.

### Permisos futuros propuestos

Sin modificar los permisos actuales, la futura implementación debería evaluar permisos explícitos, por ejemplo `VIEW_ASSIGNED_GCR`, `MANAGE_ASSIGNED_GCR`, `VIEW_ALL_GCR`, `EXPORT_GCR_EVIDENCE` y `REVIEW_GCR_AUDIT`, en vez de ampliar semánticamente permisos académicos existentes.

## 5. Flujo Teacher

1. Abre GCR y recibe solo clases asignadas.
2. Selecciona fecha, clase y estudiante; sección se oculta mientras no exista formalmente.
3. Consulta la semana lunes–viernes que contiene la fecha.
4. Abre o crea de forma idempotente el reporte diario seleccionado.
5. Registra asistencia, tareas, versículo si aplica, méritos, deméritos y comentario.
6. Guarda borrador sin declarar cumplimiento.
7. Revisa faltantes calculados por servidor.
8. Envía; el servidor fija autor, instante y condición a tiempo/tarde.
9. Si modifica datos base después del cierre, informa un motivo. Los eventos conductuales posteriores siguen disponibles y guardan hora/autor/comentario.

Los errores reales de API deben mostrarse con próximo paso; una confirmación visual nunca debe preceder a la persistencia exitosa.

## 6. Flujo Directora/Admin

1. Abre cumplimiento diario o semanal.
2. Filtra por rango, clase/grado, profesor, estudiante y estado.
3. Ve esperados, enviados a tiempo, tardíos, pendientes, incompletos, modificados y brechas de configuración.
4. Abre detalle y auditoría sin alterar el registro.
5. Exporta CSV con filtros y metadatos de generación.
6. Si posteriormente se habilitan correcciones administrativas, toda corrección exige motivo y auditoría.

## 7. Flujo Student futuro

No se implementará en el MVP. Una fase futura podrá mostrar al estudiante su semana enviada, excluyendo datos internos definidos por la institución. No podrá crear, editar, enviar ni consultar auditoría o cumplimiento global.

## 8. Filtros iniciales

- **Fecha:** fecha escolar local; por defecto hoy en `America/Panama`.
- **Clase/grado:** la selección real es `AcademicClass`; el grado se muestra desde `GradeLevel`.
- **Sección:** no disponible actualmente. Debe ocultarse, no presentar un selector vacío ni derivarse del nombre/código de clase.
- **Alumno:** matrículas `ACTIVE` de la clase seleccionada y autorizada para el actor.

Los filtros dependientes se limpian al cambiar su padre. El estado navegable debería reflejarse en query params (`date`, `classId`, `studentId`) para recarga y enlace profundo. El servidor vuelve a validar todos los identificadores.

## 9. Vista semanal

La semana inicia lunes y termina viernes. La respuesta incluirá fechas explícitas, trimestre, número de semana, estudiante, clase/grado, materias y un slot por día. Un slot puede ser `NOT_EXPECTED`, `PENDING`, `DRAFT`, `SUBMITTED_ON_TIME`, `SUBMITTED_LATE`, `INCOMPLETE` o `MODIFIED_POST_CLOSE`.

La semana del trimestre se propone como `floor((inicioDeSemanaLocal - inicioDelTrimestreLocal) / 7 días) + 1`, contando semanas calendario de lunes a domingo que intersectan el trimestre. Requiere confirmación institucional. Fechas fuera del trimestre o días no lectivos son `NOT_EXPECTED`, no pendientes.

La UI futura debe incluir estados de carga, error, vacío y éxito; navegación por teclado; foco visible; labels; `aria-live="polite"` para guardado/validación; números tabulares; y tablas adaptadas a móvil sin depender solo de color.

## 10. Materias y siglas

Las materias provienen de `ClassSubject` y las siglas de `Subject.shortName`; no se hardcodean M, EN, SC, etc. Se muestra nombre completo como texto accesible. `PRVL/PVRL` no se modelará hasta conocer su significado. La materia Bible/Religion puede asociar el versículo si existe como `Subject`, pero el registro de versículo seguirá siendo una evidencia GCR específica.

## 11. Versículo / Religión

Se propone `GcrVerse` ligado a estudiante, trimestre, reporte diario y opcionalmente `ClassSubject` de Bible/Religion. Campos: referencia/texto registrado, calificación entera 0–100, número de slot trimestral (1–3), autor y timestamps.

Para evitar duplicados, 1 registro por estudiante + trimestre + slot. No se impondrá unicidad mensual hasta confirmar si “1 por mes” es regla o aproximación. La vista semanal muestra el registro en su fecha y un progreso “n de 3”. Cambios posteriores se auditan.

## 12. Tareas por materia

`GcrSubjectTask` representa 1 resultado por reporte diario y `ClassSubject`:

- `homeworkAssigned: boolean`.
- `completionStatus: COMPLETED | NOT_COMPLETED | null`.
- `comment: string | null`.

Si `homeworkAssigned` es falso, `completionStatus` debe ser `null`. Si es verdadero, el estado puede permanecer `null` en borrador, pero será un faltante al enviar si la institución lo declara obligatorio. Restricción única propuesta: reporte + materia de clase. La materia debe pertenecer a la misma clase del reporte.

## 13. Asistencia

Se propone 1 `GcrAttendance` por reporte, con `PRESENT`, `ABSENT`, `LATE` o `HALF_DAY`, comentario opcional, autor y timestamps. La relación 1:1 evita duplicados. La asistencia es un dato base sujeto a motivo de cambio después del cierre. Debe confirmarse si existe o existirá otro sistema oficial de asistencia para evitar dos fuentes de verdad.

## 14. Méritos

Cada mérito es un evento inmutable con hora exacta, estudiante/reporte, actor, comentario obligatorio y beneficio opcional. Se permiten varios por día; por eso no se usa una restricción única por fecha. Corregir un evento crea auditoría; eliminar físicamente no se permite. La estrella es presentación, no semántica exclusiva.

## 15. Deméritos y detención

Cada demérito se guarda como evento separado con ordinal diario 1, 2 o 3, comentario obligatorio, instante y actor. Una acción que selecciona varios niveles crea todos los eventos en una transacción y exige un motivo por nivel. Restricción única propuesta: reporte + ordinal. El conteo se reinicia por reporte diario, nunca mediante un job que borre datos.

Al llegar al ordinal 3, el MVP recomendado guarda en el tercer evento `detentionRequired = true` y `detentionDate` calculada como el siguiente día lectivo, no simplemente el día calendario siguiente. No se propone una entidad `Detention` en Fase 1 hasta confirmar que habrá ciclo de vida, responsables o asistencia de detención. La generación debe ser idempotente y transaccional.

## 16. Comentarios generales

El reporte diario puede contener `generalComment`, con autor de última edición y timestamps. El texto admite contenido largo con límite definido en DTO futuro. Una edición posterior al cierre exige motivo y genera auditoría con valores anterior/nuevo.

## 17. Guardar borrador y enviar

**Guardar borrador** persiste contenido y mantiene `DRAFT`; no satisface cumplimiento. **Enviar GCR** valida el mínimo institucional, fija `submittedAt` y `submittedById`, y determina el estado usando tiempo del servidor.

Propuesta mínima provisional para enviar: asistencia presente, un resultado por cada materia esperada ese día (incluido “sin tarea” de forma explícita) y confirmación explícita de comentario general vacío o diligenciado. Versículo, mérito y demérito son condicionales. Esta regla requiere aprobación.

El submit debe ser idempotente ante doble clic. Si ya está enviado y no cambió la versión, devuelve el mismo resultado. Para concurrencia se propone `version` entero o comparación de `updatedAt`; conflictos devuelven `409` y obligan a refrescar.

## 18. Regla de cierre de las 10:00 a. m.

Se recomienda **partial lock**:

- Antes de las 10:00, el reporte base puede editarse y enviarse.
- A las 10:00, el cumplimiento se calcula desde reportes esperados y envíos persistidos.
- Un primer envío con `submittedAt` posterior a la fecha local a las 10:00 es tardío.
- Después de las 10:00, el contenido base puede corregirse solo con `postCloseReason` obligatorio y auditoría; esto equivale a soft lock para el MVP técnico.
- Méritos, deméritos e incidentes posteriores permanecen habilitados como eventos con hora, autor y comentario.

El umbral se construye y compara exclusivamente en servidor con `America/Panama`. La hora del navegador no decide estado. Deben definirse fecha escolar y manejo de horario de verano aunque Panamá actualmente no lo use.

## 19. Eventos posteriores a las 10:00 a. m.

Méritos y deméritos creados después del cierre se marcan `isPostClose` derivado del timestamp del servidor. No reescriben `submittedAt` ni convierten por sí solos un envío oportuno en tardío; sí actualizan el indicador de última actividad y generan auditoría. Cambiar asistencia, tarea, versículo o comentario base después del cierre marca el reporte `MODIFIED_POST_CLOSE` y exige motivo.

El estado operacional y los indicadores deben separarse: conservar `submittedAt`/puntualidad original y además `hasPostCloseChanges`, evitando perder evidencia histórica.

## 20. Trazabilidad y auditoría

Se propone `GcrAuditEvent` append-only con reporte, tipo/id de entidad, acción, actor, timestamp, motivo, valores anterior/nuevo en JSON y metadatos de solicitud no sensibles. Debe registrar creación, actualización, envío, corrección posterior y eventual anulación administrativa.

No se permiten borrados físicos de GCR ni eventos conductuales en el MVP. Si una entrada fue errónea, se anula con `voidedAt`, `voidedById`, `voidReason` y auditoría. Las transacciones agrupan cambio + auditoría. Nunca se guardan contraseñas, tokens o datos de sesión en auditoría.

## 21. Pantalla de cumplimiento para Dirección/Admin

La unidad de cumplimiento es cada GCR esperado: fecha + clase + estudiante + profesor responsable. Debe mostrar profesor, clase/grado, estudiante, estado, hora de envío local, faltantes, última modificación y cambios posteriores.

### Cálculo de GCR esperado

Para una fecha lectiva y trimestre/año aplicable:

1. Tomar clases activas del año académico correspondiente.
2. Tomar matrículas `ACTIVE` de cada clase.
3. Resolver exactamente 1 `ClassTeacher.isPrimary` activo como responsable.
4. Excluir días sin clase según calendario escolar futuro; mientras no exista, no automatizar feriados.
5. Comparar la clave esperada fecha + clase + estudiante con `GcrReport`.

Sin profesor primario o con más de uno, mostrar `CONFIGURATION_GAP`; no atribuir incumplimiento. La temporalidad histórica de matrículas/asignaciones no está modelada hoy y es un riesgo: el cálculo retrospectivo no debe depender únicamente del estado actual.

Resultados paginados en servidor, con conteos agregados en una consulta separada. No cargar todos los reportes ni hacer N+1 por estudiante.

## 22. Exportes y evidencia semanal

CSV es el formato MVP por no requerir infraestructura adicional. Debe respetar los filtros autorizados e incluir: generación (fecha/hora/zona), usuario generador, rango, profesor, clase/grado, sección si llega a existir, estudiante, fecha, estado, envío, puntualidad, faltantes, última modificación y resumen de eventos posteriores.

La exportación se genera desde servidor, con escape CSV correcto, codificación UTF-8 y fórmula neutralizada para valores que comiencen por `=`, `+`, `-` o `@`. Para rangos grandes se necesitará streaming o límite; no se propone PDF ni firma en MVP.

## 23. Notificaciones MVP

No habrá email, push, cron ni scheduler. Después de las 10:00, el dashboard consulta y muestra una alerta con pendientes y brechas de configuración. La consulta no debe escribir snapshots ni reconciliar datos. `GcrComplianceSnapshot` queda fuera hasta que métricas o requisitos legales justifiquen materialización.

## 24. Modelo de datos propuesto

Los nombres son provisionales y se validarán en Fase 1.

### `GcrReport`

Reporte diario: `id`, `studentId`, `classId`, `academicTermId`, `reportDate @db.Date`, `responsibleTeacherId`, `status`, `generalComment`, `missingFields Json?`, `submittedAt`, `submittedById`, `firstSubmittedAt`, `isLate`, `hasPostCloseChanges`, `version`, autores/timestamps y datos de anulación. Restricción única: estudiante + clase + fecha. Índices candidatos, sujetos a `EXPLAIN`: `(reportDate, status)`, `(responsibleTeacherId, reportDate, status)`, `(classId, reportDate)`.

### Entidades hijas

- `GcrAttendance`: 1:1 con reporte.
- `GcrSubjectTask`: reporte + `classSubjectId`, único por ambos.
- `GcrVerse`: reporte, estudiante, término, slot 1–3 y materia opcional; único estudiante + término + slot.
- `GcrMerit`: eventos múltiples, sin unicidad diaria.
- `GcrDemerit`: eventos, único reporte + ordinal; detención MVP embebida.
- `GcrAuditEvent`: append-only e indexado por reporte + fecha.

No se recomienda `GcrDayEntry` porque `GcrReport` ya es diario. Tampoco `GcrGeneralComment` separado salvo que se necesiten múltiples comentarios; auditoría preserva versiones. `GcrComplianceSnapshot` y `GcrDetention` quedan diferidos.

### Estados/enums propuestos

`GcrReportStatus`: `DRAFT`, `SUBMITTED_ON_TIME`, `SUBMITTED_LATE`, `INCOMPLETE`, `MODIFIED_POST_CLOSE`, `VOIDED`. `PENDING` y `NOT_EXPECTED` son estados calculados, no filas persistidas.

### Integridad

Las claves únicas son la última defensa ante dobles solicitudes. Las escrituras compuestas deben usar transacciones. Todas las fechas de negocio son locales explícitas; timestamps se almacenan como instantes. Las relaciones de autor deben preferir `onDelete: Restrict` o `SetNull` según política, nunca borrar evidencia en cascada desde User sin revisión.

## 25. Endpoints propuestos

Siguiendo el estilo REST/NestJS actual, bajo controlador `gcr`:

- `GET /gcr/teacher/filters/classes?date=`
- `GET /gcr/teacher/filters/students?classId=&date=`
- `GET /gcr/teacher/students/:studentId/week?classId=&date=`
- `POST /gcr/teacher/reports` — apertura idempotente del borrador.
- `PATCH /gcr/teacher/reports/:reportId` — campos base y comentario.
- `PUT /gcr/teacher/reports/:reportId/attendance`
- `PUT /gcr/teacher/reports/:reportId/subject-tasks/:classSubjectId`
- `PUT /gcr/teacher/reports/:reportId/verse`
- `POST /gcr/teacher/reports/:reportId/merits`
- `POST /gcr/teacher/reports/:reportId/demerits` — lote transaccional.
- `POST /gcr/teacher/reports/:reportId/submit`
- `GET /gcr/admin/compliance?from=&to=&classId=&teacherId=&studentId=&status=&cursor=&limit=`
- `GET /gcr/admin/compliance/export?...`
- `GET /gcr/admin/reports/:reportId/audit?cursor=&limit=`

`PUT` se usa para recursos singulares idempotentes; no se requiere un endpoint genérico por día y otro específico para la misma escritura. DTOs rechazan propiedades desconocidas. Respuestas semanales minimizan payload y no incluyen auditoría completa.

## 26. Pantallas y componentes propuestos

### Teacher

- Ruta futura `/teacher/gcr`.
- `GcrFilterBar`, `GcrWeekView`, `GcrDayCard`, `GcrStatusBadge`.
- Editores pequeños: asistencia, tarea, versículo, mérito y demérito.
- `GcrSubmitChecklist` y diálogo de motivo posterior al cierre.

### Dirección/Admin

- Ruta futura `/director/gcr` y acceso Admin equivalente según navegación existente.
- `GcrComplianceFilters`, métricas, tabla paginada, detalle/auditoría y exportación.

Los componentes pesados se cargarán bajo demanda; consultas independientes podrán iniciarse en paralelo. Los datos filtrables/paginados vivirán en URL. Listas mayores a 50 filas requieren paginación y, solo si se vuelve necesario, virtualización. No se introducirá SWR ni otra dependencia sin justificarla.

## 27. Validaciones y criterios de aceptación

- El Teacher solo recibe y modifica estudiantes con matrícula activa en clases asignadas; el servicio valida pertenencia en cada operación.
- Un GCR esperado se calcula con día lectivo + matrícula activa + clase + profesor primario.
- Puntualidad se calcula en servidor contra 10:00 `America/Panama`.
- Datos base cambiados tras cierre exigen motivo; eventos posteriores siguen permitidos y son trazables.
- La unicidad estudiante + clase + fecha evita reportes duplicados.
- Relaciones 1:1/únicas evitan duplicar asistencia/tareas/versículos; méritos y deméritos son eventos intencionalmente múltiples, con ordinal único para deméritos.
- Autor y timestamp del servidor se registran en creación, envío, corrección y anulación.
- CSV se genera desde datos persistidos, con actor, rango y zona horaria.
- Score de versículo entre 0 y 100; ordinal de demérito entre 1 y 3; comentarios obligatorios donde corresponda.
- Fechas deben pertenecer al término/año y no aceptar fechas futuras salvo permiso institucional explícito.
- `studentId`, `classSubjectId` y término deben ser coherentes con la clase del reporte.
- El cliente muestra errores inline, enfoca el primer error, advierte cambios sin guardar y mantiene acciones deshabilitadas solo durante la solicitud.

## 28. Riesgos técnicos

1. **Responsabilidad docente ambigua:** `isPrimary` existe, pero no garantiza exactamente un responsable por clase.
2. **Sin historial efectivo:** matrícula, asignación docente y materias no tienen vigencia desde/hasta; reportes retrospectivos podrían cambiar si se recalculan con el presente.
3. **Sin calendario escolar:** no se pueden excluir feriados, cierres o actividades especiales con precisión ni calcular “siguiente día lectivo”.
4. **Sección inexistente:** agregarla precipitadamente afectaría clases, matrículas y filtros.
5. **Fuente de asistencia:** posible duplicación futura con otro módulo.
6. **Concurrencia:** varios docentes o pestañas podrían sobrescribir datos sin control de versión.
7. **Auditoría y privacidad:** JSON de cambios puede crecer y contener información sensible; requiere retención y acceso definidos.
8. **Cumplimiento a escala:** generar esperados dinámicamente puede ser costoso; debe paginarse y medirse antes de añadir índices/snapshots/caché.
9. **Zona horaria:** inconsistencias si fechas `@db.Date`, instantes UTC y límites locales se mezclan.
10. **Estado compuesto:** un único enum puede ocultar puntualidad original cuando hay cambios posteriores; se requieren indicadores separados.
11. **Detención:** “día siguiente” es incorrecto sin calendario lectivo.
12. **Permisos:** reutilizar permisos amplios existentes podría dar acceso excesivo; los nuevos requieren aprobación explícita.

No se debe cachear GCR, notas, permisos, asistencia o eventos conductuales. Primero se medirán p95/p99, tamaño de respuesta, errores y consultas; solo después se justificarán índices o materialización.

## 29. Preguntas pendientes

### Críticas antes de Fase 1

1. ¿Qué significa exactamente PRVL/PVRL?
2. ¿Las secciones existen formalmente fuera del schema y deben modelarse, o cada `AcademicClass` ya representa una sección?
3. ¿El cierre de 10:00 aplica a todos los grados y días lectivos?
4. ¿El GCR se llena individualmente o se permite captura grupal con ajustes?
5. ¿Qué campos son obligatorios antes de enviar?
6. ¿Quién puede corregir un GCR enviado y requiere aprobación de Dirección?
7. ¿La detención necesita entidad y ciclo de vida o basta una marca MVP?
8. ¿El formato oficial de evidencia es CSV, Excel o PDF? ¿Requiere firma/aprobación?
9. ¿Cuál es la zona horaria oficial? Esta especificación asume `America/Panama`.
10. ¿El GCR aplica a estudiantes presenciales, homeschooling o ambos?
11. ¿Quién es responsable cuando hay varios profesores, ninguno primario, sustitución o ausencia?
12. ¿Qué días cuentan como lectivos y dónde se administran feriados/cierres?

### De producto y operación

13. ¿Padres o estudiantes verán parte del GCR?
14. ¿Qué materias exactas aparecen por grado y qué representa “sin tarea”?
15. ¿Cómo calcula oficialmente la institución la semana del trimestre?
16. ¿Qué pasa en actividades especiales o días parciales?
17. ¿“Guardar y enviar” notifica a alguien o solo persiste?
18. ¿Los deméritos notifican automáticamente a Dirección?
19. ¿Un profesor de materia puede editar solo su materia o todo el reporte?
20. ¿El tercer demérito ocurre por ordinal acumulado o por niveles semánticos distintos?
21. ¿Debe poder anularse un mérito/demérito erróneo y quién puede hacerlo?
22. ¿Existe otra fuente oficial de asistencia?
23. ¿Qué política de retención exige la certificación?

## 30. Plan de implementación por fases

- **Fase 0 (actual):** aprobar esta especificación.
- **Fase 1 recomendada:** cerrar decisiones críticas, diseñar modelo mínimo, enums, relaciones, constraints e índices justificados; crear una migración nueva y pruebas de integridad. Sin UI.
- **Fase 2:** módulo backend Teacher para filtros, semana, borrador y submit, con autorización por pertenencia.
- **Fase 3:** persistencia diaria de asistencia, tareas, versículo, méritos, deméritos y comentarios.
- **Fase 4:** cierre, control de versión y auditoría completa.
- **Fase 5:** frontend Teacher accesible y conectado a API real.
- **Fase 6:** cumplimiento Directora/Admin paginado.
- **Fase 7:** exportación CSV; otros formatos solo si se confirman.
- **Fase 8:** seed demo específico y QA funcional, seguridad, zona horaria y baseline de rendimiento.

Cada fase debe probar un flujo completo y no activar acciones visuales sin persistencia real.

## 31. Qué NO implementar todavía

- Ningún código, schema o migración durante Fase 0.
- Secciones hasta definir su semántica.
- Vista Student/Parent.
- Email, push, cron o scheduler.
- PDF, Excel o firma digital.
- `GcrComplianceSnapshot`.
- Entidad formal de detención sin flujo aprobado.
- Captura masiva por grupo.
- Edición colaborativa en tiempo real.
- Caché de GCR, notas, permisos o conducta.
- Índices sin validar consultas y planes.
- Integración con storage.
- Cambios a autenticación o permisos existentes.

## Archivos probables para Fase 1 (sin modificar ahora)

La primera fase de implementación debería limitarse a:

- `apps/api/prisma/schema.prisma` — nuevos enums, modelos, relaciones, constraints e índices aprobados.
- `apps/api/prisma/migrations/<timestamp>_add_gcr_core/migration.sql` — migración nueva; nunca editar migraciones aplicadas.
- `packages/shared/src/` — únicamente enums/tipos de dominio necesarios si Fase 1 incluye contratos compartidos.
- Archivo índice/exportador existente de `packages/shared/src/`, si los nuevos tipos necesitan exposición pública.
- Pruebas de integridad Prisma en la ubicación de pruebas ya usada por el repositorio, después de confirmar el patrón vigente.

No deberían tocarse todavía controllers, services, rutas de Next.js, features web, seed, storage, auth ni asignación efectiva de permisos.

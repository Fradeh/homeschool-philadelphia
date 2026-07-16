# PLAN CODEX — Módulo Goal Check Report (GCR) para HomeSchool Philadelphia

## Objetivo general

Crear una especificación completa para implementar el módulo **Goal Check Report (GCR)** dentro de HomeSchool Philadelphia.

Este módulo es importante porque Philadelphia International School está buscando una certificación y necesita evidencia diaria del seguimiento académico, asistencia, conducta, méritos, desméritos y cumplimiento de los profesores.

Por ahora **NO implementar código**.  
Primero se debe crear un documento técnico/funcional para no perder reglas importantes.

> Versión revisada: incluye reglas de cierre, trazabilidad, evidencia para certificación, criterios de aceptación, zona horaria y preguntas pendientes críticas.


---

## Skills que debes usar

Usa estas skills si están disponibles:

```txt
$vercel-react-best-practices
$web-design-guidelines
$mvp-persistence-fixer
$performance-mvp-optimizer
```

Si alguna skill no está disponible o Codex no la reconoce, continúa aplicando el flujo equivalente de forma manual.

---

## Agentes internos sugeridos

Trabaja como si usaras estos subagentes especializados:

```txt
1. Functional Analyst Agent
   - Levanta reglas funcionales del GCR.
   - Organiza flujos de Teacher, Admin/Directora y Student.

2. Database Architect Agent
   - Propone modelo de datos relacional.
   - Cuida trazabilidad, auditoría y relaciones con clases, estudiantes, teachers y materias.

3. Backend API Agent
   - Propone endpoints REST.
   - Define validaciones, permisos, reglas de cierre y estados.

4. Frontend UX Agent
   - Propone pantallas modernas, claras y rápidas.
   - Mejora la experiencia actual del GCR sin copiar visualmente el sistema viejo.

5. QA / Certification Evidence Agent
   - Define evidencia descargable.
   - Define trazabilidad, reportes semanales y validaciones para certificación.
```

No tienes que crear archivos por cada agente. Solo usa esa división mental para analizar correctamente.

---

## Contexto del sistema actual de referencia

Actualmente Philadelphia tiene una pantalla externa de GCR con este flujo:

1. El usuario entra al GCR.
2. Selecciona:
   - Fecha.
   - Clase/grado.
   - Sección.
   - Alumno.
3. Presiona “Ver GCR”.
4. Se despliega una vista semanal del estudiante.
5. Se muestra:
   - Nombre del alumno.
   - Semana del trimestre.
   - Trimestre actual.
   - Días de lunes a viernes.
   - Día actual resaltado.
   - Leyenda de materias por siglas.
   - Versículo.
   - Tareas por materia.
   - Asistencia.
   - Méritos.
   - Desméritos.
   - Comentarios generales.
6. El profesor guarda y envía la información.

La plataforma nueva debe mejorar este flujo, hacerlo más moderno, más claro, más trazable y útil para certificación.

---

## Necesidad principal

Philadelphia necesita que todos los profesores completen el GCR diariamente.  
La directora pidió control de cumplimiento, especialmente que a las **10:00 a. m.** se pueda saber quién no realizó el GCR.

Pero hay un punto importante:

No se debe bloquear completamente el GCR después de las 10:00 a. m., porque si un estudiante se desaconducta después de esa hora, el profesor debe poder registrar méritos, desméritos o incidentes posteriores.

Por eso se necesita una regla madura de cierre parcial.

---

## Regla propuesta para las 10:00 a. m.

No implementar todavía. Solo documentar y proponer.

La regla recomendada es:

```txt
Antes de las 10:00 a. m.:
- El profesor debe completar el GCR base del día.

A las 10:00 a. m.:
- El sistema debe poder detectar quién completó y quién no completó.
- Dirección/Admin debe ver el estado de cumplimiento.

Después de las 10:00 a. m.:
- El GCR base queda marcado como tarde si no fue enviado.
- Cambios al GCR base deben requerir motivo o quedar marcados como modificación posterior al cierre.
- Méritos, desméritos e incidentes posteriores sí deben permitirse.
- Todo evento posterior debe guardar hora exacta, autor y comentario obligatorio.
```

Evaluar en la especificación estas opciones:

```txt
1. Hard lock:
   Bloquea todo después de las 10:00 a. m.
   No recomendado porque impide registrar conducta posterior.

2. Soft lock:
   Permite cambios después de las 10:00 a. m., pero marca como tarde/modificado.
   Recomendado para MVP.

3. Partial lock:
   Bloquea edición libre del GCR base, pero permite eventos posteriores.
   Recomendado como opción ideal.
```

---

## Reglas funcionales conocidas

### 1. Filtros iniciales

La pantalla debe permitir filtrar por:

```txt
- Fecha.
- Clase o grado.
- Sección.
- Alumno.
```

Reglas:

```txt
- El alumno debe filtrarse según clase/grado y sección.
- El profesor solo debe ver alumnos asignados a sus clases.
- Dirección/Admin puede ver todos.
- Si no existe sección en el modelo actual, proponer cómo manejarlo.
- No inventar datos si el modelo ya tiene otra estructura.
```

---

### 2. Vista semanal del GCR

Al seleccionar un estudiante y presionar “Ver GCR”, debe mostrarse una vista semanal.

Debe incluir:

```txt
- Nombre completo del alumno.
- Clase/grado.
- Sección si aplica.
- Trimestre actual.
- Semana del trimestre.
- Fechas de lunes a viernes.
- Día actual o día seleccionado resaltado.
- Estado del GCR:
  - pendiente
  - borrador
  - enviado a tiempo
  - enviado tarde
  - incompleto
  - modificado después del cierre
```

---

### 3. Leyenda de materias

La vista debe mostrar siglas de materias.

Ejemplos actuales:

```txt
M = Math
EN = English
WB = World Building
CW = Creative Writing
SC = Science
SS = Social Studies
B = Bible
EL = Elective
ATND = Attendance
MT = Merit
DMT = Demerit/Detention
bible = Verse Reading
PRVL/PVRL = pendiente de confirmar
```

Reglas:

```txt
- No hardcodear siglas si el sistema puede usar materias configurables.
- Si el modelo actual tiene Subject, usar Subject.
- Si no existe abreviatura, proponer agregar configuración futura.
- PRVL/PVRL debe quedar como pregunta pendiente porque aún no está confirmado.
```

---

### 4. Versículo / Religión

El alumno debe aprender versículos durante el trimestre.

Reglas conocidas:

```txt
- El alumno debe aprender 3 versículos por trimestre.
- Aproximadamente 1 versículo por mes.
- El profesor debe registrar calificación de 0 a 100.
- Debe registrar el versículo o referencia.
- Debe quedar asociado al estudiante, trimestre, mes/semana y día.
- Debe poder consultarse como evidencia.
```

La especificación debe proponer:

```txt
- Si esto debe ser GcrVerse.
- Si se relaciona con materia Bible/Religion.
- Cómo mostrarlo en la vista semanal.
- Cómo evitar duplicar versículos del mismo mes/trimestre.
```

---

### 5. Tareas por materia

Para cada día y materia, el profesor puede marcar tareas.

Opciones actuales:

```txt
H = Homework assigned / tarea asignada.
C = Completed / completada.
X = Not completed / no realizada o incompleta.
```

Reglas:

```txt
- Al seleccionar H, se habilitan C y X.
- Si no hay H, C y X no deberían estar activos.
- Debe permitir comentario.
- Debe guardar materia, día, estado y comentario.
- Debe quedar trazabilidad de quién registró y cuándo.
- Debe poder editarse con auditoría si se cambia después.
```

La especificación debe proponer si el modelo debe guardar:

```txt
homeworkAssigned: boolean
completedStatus: COMPLETED | NOT_COMPLETED | null
comment: string | null
```

---

### 6. Asistencia

Opciones de asistencia:

```txt
PRESENTE
AUSENTE
TARDANZA
MEDIA_JORNADA
```

Reglas:

```txt
- Debe guardarse por estudiante y día.
- Debe permitir comentario.
- Debe quedar trazabilidad.
- Debe mostrarse de forma visual y rápida.
```

---

### 7. Méritos

El profesor puede asignar méritos.

Reglas:

```txt
- El mérito se representa visualmente con una estrella.
- Debe permitir comentario indicando el motivo.
- Puede permitir registrar beneficio otorgado.
```

Ejemplos de beneficios:

```txt
- Escuchar música con audífonos.
- Privilegio en el aula.
- Reconocimiento.
- Otro beneficio indicado por el profesor.
```

Reglas técnicas:

```txt
- Guardar fecha.
- Guardar hora.
- Guardar estudiante.
- Guardar teacher/autor.
- Guardar comentario.
- Guardar beneficio si aplica.
```

---

### 8. Desméritos

Los desméritos son uno de los puntos más importantes.

Reglas conocidas:

```txt
- Existen niveles 1, 2 y 3.
- Los desméritos se reinician cada día.
- Al tercer desmérito, el estudiante queda con detención al día siguiente.
- Se debe poder seleccionar 1, 2 o 3 desméritos en una sola acción para agilizar.
- Si se seleccionan varios desméritos, debe obligar a escribir motivo para cada nivel.
```

Ejemplo:

```txt
Si el profesor selecciona desméritos 1, 2 y 3 juntos, debe pedir:

- Motivo del desmérito 1.
- Motivo del desmérito 2.
- Motivo del desmérito 3.
```

Reglas técnicas:

```txt
- Guardar cada desmérito como evento separado.
- Guardar nivel.
- Guardar comentario obligatorio.
- Guardar fecha y hora exacta.
- Guardar autor.
- Si llega a nivel 3, marcar/generar detención para el día siguiente.
```

La especificación debe proponer cómo modelar:

```txt
- GcrDemerit
- Detention
- detentionDate
- detentionGeneratedByDemeritId
```

Si no conviene crear Detention todavía, proponer versión MVP.

---

### 9. Comentarios generales

Cada día debe poder tener comentarios generales.

Reglas:

```txt
- Comentario general por estudiante y día.
- Visible en GCR semanal.
- Guardar autor y timestamp.
```

---

### 10. Guardar y enviar

La UI debe diferenciar:

```txt
Guardar borrador:
- Permite guardar avances sin enviar como final.

Enviar GCR:
- Marca el GCR diario como enviado.
- Guarda submittedAt.
- Determina si fue enviado a tiempo o tarde.
```

Reglas:

```txt
- Debe mostrar qué campos faltan antes de enviar.
- Debe permitir enviar aunque algunos campos estén vacíos solo si la regla institucional lo permite.
- Si no, proponer validaciones mínimas obligatorias.
```

---

## Trazabilidad obligatoria

Todo el módulo debe estar pensado para certificación.

Debe poder saberse:

```txt
- Qué profesor completó el GCR.
- Cuándo lo completó.
- Si fue completado antes o después de las 10:00 a. m.
- Qué profesor modificó algo.
- Cuándo se modificó.
- Qué se modificó.
- Qué faltó completar.
- Qué estudiantes no tienen GCR.
- Qué profesores no completaron sus GCR.
```

Campos sugeridos:

```txt
createdAt
updatedAt
createdById
updatedById
submittedAt
submittedById
lockedAt
lateReason
postCloseReason
status
```

También proponer tabla de auditoría:

```txt
GcrAuditEvent
```

Con campos como:

```txt
id
reportId
entityType
entityId
action
oldValue
newValue
actorId
createdAt
reason
```

---

## Pantalla de Dirección/Admin

La directora necesita una pantalla para ver cumplimiento.

Debe permitir:

```txt
- Ver cumplimiento diario.
- Ver cumplimiento semanal.
- Filtrar por fecha.
- Filtrar por semana.
- Filtrar por grado/clase.
- Filtrar por sección.
- Filtrar por profesor.
- Filtrar por estudiante.
```

Estados visibles:

```txt
- Completado a tiempo.
- Completado tarde.
- Pendiente.
- Incompleto.
- Modificado después del cierre.
```

Debe mostrar:

```txt
- Profesor.
- Clase.
- Sección.
- Alumno.
- Fecha.
- Estado.
- Hora de envío.
- Faltantes.
- Última modificación.
```

Debe permitir exportar evidencia.

Formatos propuestos:

```txt
- CSV como MVP.
- Excel si el proyecto ya tiene soporte.
- PDF más adelante.
```

Si no existe infraestructura de exportación, proponer CSV primero.

---

## Notificaciones

Para MVP no implementar email ni push si no existe infraestructura.

Propuesta MVP:

```txt
- En el panel de Directora/Admin, mostrar alerta después de las 10:00 a. m.
- La alerta lista profesores/estudiantes sin GCR enviado.
- El cálculo puede hacerse por consulta al dashboard.
```

No implementar scheduler/cron todavía salvo que ya exista.

---

## Roles y permisos

### Teacher

Puede:

```txt
- Ver estudiantes asignados a sus clases.
- Crear/editar GCR de sus estudiantes.
- Guardar borrador.
- Enviar GCR.
- Registrar asistencia.
- Registrar tareas.
- Registrar versículos.
- Registrar méritos.
- Registrar desméritos.
- Registrar eventos posteriores al cierre con motivo.
```

No puede:

```txt
- Ver estudiantes no asignados.
- Descargar reportes globales de toda la escuela.
- Modificar reportes de otros profesores, salvo que ya tenga permisos especiales.
```

### Directora/Admin

Puede:

```txt
- Ver todos los GCR.
- Ver cumplimiento diario/semanal.
- Ver pendientes.
- Ver tardíos.
- Ver modificaciones posteriores al cierre.
- Descargar evidencia.
- Auditar registros.
```

### Student

Por ahora:

```txt
- No edita GCR.
- Puede quedar fuera del módulo en fase 1.
- Se puede proponer vista solo lectura en fase futura.
```

---

## UX esperada

No copiar visualmente el sistema viejo.  
La nueva pantalla debe ser más moderna, más clara y más rápida.

Principios:

```txt
- Menos ruido visual.
- Filtros claros arriba.
- Vista semanal organizada.
- Acciones rápidas por día.
- Modales pequeños para editar asistencia, tareas, méritos, desméritos y versículo.
- Estados visibles.
- Validaciones claras.
- Botón Guardar borrador.
- Botón Enviar GCR.
- Indicador de cumplimiento antes de las 10:00 a. m.
```

La UI debe evitar que sea tedioso para el profesor.

Especialmente para desméritos:

```txt
- Permitir registrar varios niveles en una sola acción.
- Pedir motivo obligatorio por cada nivel.
- Mostrar advertencia cuando se llega al tercer desmérito.
```

---

## Alcance de análisis del proyecto

Revisar el proyecto actual para entender:

```txt
- Usuarios.
- Roles.
- Teachers.
- Students.
- Clases.
- Secciones si existen.
- Materias.
- Horarios.
- PACEs.
- Calificaciones.
- Permisos.
- Patrones actuales de backend.
- Patrones actuales de frontend.
- Shared types.
```

Archivos/directorios probables:

```txt
AGENTS.md
apps/api/prisma/schema.prisma
apps/api/src/modules/**
apps/web/features/**
apps/web/lib/**
packages/shared/src/**
.agents/skills/**
```

---

## Restricciones importantes

En esta primera tarea:

```txt
NO implementar código.
NO cambiar schema.
NO crear migraciones.
NO tocar frontend.
NO tocar backend.
NO modificar endpoints.
NO tocar seed.
NO tocar storage.
NO tocar autenticación.
NO tocar permisos existentes.
```

Solo se debe crear documentación técnica y funcional.

---

## Archivo que debes crear

Crear:

```txt
docs/GCR_SPEC.md
```

---

## Contenido obligatorio de docs/GCR_SPEC.md

El archivo debe incluir estas secciones:

```txt
1. Resumen del módulo.
2. Objetivo institucional y relación con certificación.
3. Estado actual observado del GCR de referencia.
4. Roles y permisos.
5. Flujo Teacher.
6. Flujo Directora/Admin.
7. Flujo Student si aplica en fases futuras.
8. Filtros iniciales: fecha, clase/grado, sección, alumno.
9. Vista semanal.
10. Materias y siglas.
11. Versículo / Religión.
12. Tareas por materia.
13. Asistencia.
14. Méritos.
15. Desméritos y detención.
16. Comentarios generales.
17. Guardar borrador y enviar GCR.
18. Regla de cierre de las 10:00 a. m.
19. Eventos posteriores a las 10:00 a. m.
20. Trazabilidad y auditoría.
21. Pantalla de cumplimiento para Dirección/Admin.
22. Exportes/evidencia semanal.
23. Notificaciones MVP.
24. Modelo de datos propuesto.
25. Endpoints propuestos.
26. Pantallas/componentes propuestos.
27. Validaciones.
28. Riesgos técnicos.
29. Preguntas pendientes.
30. Plan de implementación por fases.
31. Qué NO implementar todavía.
```

---

## Modelo de datos a proponer

Analiza el schema actual antes de proponer nombres definitivos.

Como base, evaluar si conviene algo parecido a:

```txt
GcrReport
GcrDayEntry
GcrSubjectTask
GcrVerse
GcrAttendance
GcrMerit
GcrDemerit
GcrGeneralComment
GcrAuditEvent
GcrComplianceSnapshot opcional
GcrDetention opcional
```

No implementar estas tablas todavía.  
Solo proponerlas en el documento.

---

## Endpoints a proponer

Proponer endpoints REST, sin implementarlos.

Ejemplos esperados:

```txt
GET /gcr/filters/classes
GET /gcr/filters/students?classId=&sectionId=&date=
GET /gcr/reports/student/:studentId/week?date=
POST /gcr/reports
PATCH /gcr/reports/:id/day/:date
POST /gcr/reports/:id/submit
POST /gcr/reports/:id/attendance
POST /gcr/reports/:id/subject-task
POST /gcr/reports/:id/verse
POST /gcr/reports/:id/merits
POST /gcr/reports/:id/demerits
GET /gcr/admin/compliance?from=&to=&classId=&teacherId=
GET /gcr/admin/compliance/export
GET /gcr/admin/audit/:reportId
```

Ajustar nombres según patrones existentes del proyecto.

---

## Plan de implementación esperado

El documento debe proponer fases pequeñas:

```txt
Fase 0:
Especificación docs/GCR_SPEC.md.

Fase 1:
Modelo de datos y migración.

Fase 2:
Backend Teacher para filtros, lectura semanal, borrador y submit.

Fase 3:
Registros diarios:
- asistencia
- tareas por materia
- versículo
- méritos
- desméritos
- comentarios

Fase 4:
Regla de cierre 10:00 a. m. y trazabilidad.

Fase 5:
Frontend Teacher GCR.

Fase 6:
Dashboard Directora/Admin de cumplimiento.

Fase 7:
Export CSV/Excel/PDF.

Fase 8:
Seed demo y QA.
```

---

## Preguntas pendientes que debes dejar documentadas

Incluir estas preguntas en `docs/GCR_SPEC.md`:

```txt
1. ¿Qué significa exactamente PRVL/PVRL?
2. ¿Las secciones existen formalmente en el sistema actual?
3. ¿El cierre de 10:00 a. m. aplica para todos los grados o solo algunos?
4. ¿El GCR se llena por estudiante individual o puede llenarse por grupo y luego ajustar por estudiante?
5. ¿Qué campos son obligatorios antes de enviar?
6. ¿Quién puede corregir un GCR enviado?
7. ¿La detención por tercer desmérito debe crear una entidad formal o solo marcarse en el reporte?
8. ¿La directora necesita CSV, Excel o PDF para certificación?
9. ¿Los padres o estudiantes podrán ver parte del GCR?
10. ¿Qué materias exactas deben aparecer por grado?
11. ¿Cómo se calcula la semana del trimestre en el sistema actual?
12. ¿Qué zona horaria debe usarse oficialmente? Probablemente America/Panama.
13. ¿Qué pasa si un día no hay clases?
14. ¿Qué pasa con feriados o actividades especiales?
15. ¿Debe existir aprobación de Dirección para cambios después de las 10:00 a. m.?
```


---

## Criterios de aceptación para la especificación

La especificación se considerará completa solo si responde claramente:

```txt
1. Cómo se evita que un profesor vea alumnos que no le corresponden.
2. Cómo se calcula qué GCR se esperaba para cada profesor cada día.
3. Cómo se determina si un GCR fue enviado a tiempo o tarde.
4. Qué puede editarse después de las 10:00 a. m. y qué requiere motivo.
5. Cómo se registran eventos posteriores al cierre sin romper la trazabilidad.
6. Cómo se evita duplicar GCR del mismo estudiante en la misma fecha.
7. Cómo se evita duplicar asistencia, tareas, méritos o desméritos del mismo día.
8. Cómo se registra quién creó, modificó, envió o corrigió cada dato.
9. Cómo se genera evidencia descargable para certificación.
10. Qué queda fuera del MVP para no sobrecomplicar la primera versión.
```

---

## Reglas técnicas adicionales a evaluar

Codex debe evaluar si conviene proponer constraints únicos para evitar duplicados, por ejemplo:

```txt
- Un GCR diario por estudiante, fecha, clase/sección.
- Una asistencia por estudiante y fecha.
- Un registro de tarea por estudiante, fecha y materia.
- Un registro de versículo por estudiante, trimestre y mes si aplica.
- Desméritos como eventos separados, no como un único contador editable.
```

También debe evaluar si los registros deben usar eliminación lógica o si no deben eliminarse nunca por razones de auditoría/certificación.

---

## Zona horaria

La especificación debe asumir inicialmente:

```txt
America/Panama
```

La regla de cierre de las 10:00 a. m. debe calcularse con esa zona horaria, no con UTC ni con la hora del navegador.

---

## Evidencia para certificación

La evidencia descargable debe incluir como mínimo:

```txt
- Fecha de generación.
- Usuario que generó el reporte.
- Rango de fechas.
- Profesor.
- Clase/grado.
- Sección si aplica.
- Estudiante.
- Estado del GCR.
- Hora de envío.
- Indicador de tarde/a tiempo.
- Faltantes.
- Última modificación.
- Eventos posteriores al cierre si existen.
```

---

## Preguntas adicionales pendientes

Agregar también estas preguntas pendientes en `docs/GCR_SPEC.md`:

```txt
16. ¿El botón “Guardar y Enviar” del sistema actual envía notificación por email/push a alguien o solo guarda internamente?
17. ¿La evidencia semanal debe estar firmada/aprobada por Dirección o basta con exportarla desde el sistema?
18. ¿Los desméritos deben notificarse automáticamente a Dirección o solo aparecer en el reporte?
19. ¿Qué pasa si un profesor está ausente y otro profesor debe completar el GCR?
20. ¿El GCR aplica también para homeschooling o solo para estudiantes presenciales/regulares?
```

---

## Confirmación final antes de implementar

Después de crear `docs/GCR_SPEC.md`, Codex no debe continuar con migraciones ni código hasta que el usuario confirme la especificación.

La siguiente fase solo debe comenzar cuando estén claros estos puntos:

```txt
- Significado de PRVL/PVRL.
- Existencia real de secciones en el modelo actual.
- Regla final de cierre de las 10:00 a. m.
- Campos obligatorios antes de enviar.
- Formato requerido para evidencia de certificación.
- Alcance exacto: homeschooling, presencial o ambos.
```

---

## Entrega esperada de Codex

Al terminar, responde con:

```txt
- Archivo creado.
- Resumen de la especificación.
- Riesgos más importantes.
- Preguntas pendientes críticas.
- Fase recomendada para empezar implementación.
- Archivos que probablemente se tocarían en la fase 1.
```

No implementar nada todavía.

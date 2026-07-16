# Inventario técnico y funcional — HomeSchool Philadelphia

**Propósito.** Documento de base para una propuesta formal a Philadelphia International School. Refleja el estado del repositorio revisado el 11 de julio de 2026. No contiene credenciales, datos personales de estudiantes ni cadenas de conexión.

## 1. Estado general actual

HomeSchool Philadelphia es un monorepo con una base funcional de API, base de datos y portal web. La persistencia relacional está modelada con Prisma/PostgreSQL y varios flujos ya operan contra API real: acceso, configuración académica, clases, PACEs, horarios, reservas, mensajería, notificaciones, calendario, materiales/tareas y GCR de Teacher.

El estado no es todavía el de una primera producción institucional. La interfaz web combina superficies conectadas a API con componentes heredados de demostración/mock, el despliegue de producción no está definido en el repositorio y faltan operaciones institucionales (correo, monitoreo, backups, exportaciones y vistas de GCR para Dirección). La semilla está protegida para uso local y contiene datos demostrativos; no se debe usar como carga inicial productiva.

### Lectura por horizonte

| Horizonte | Situación |
| --- | --- |
| Ya desarrollado | Backend NestJS, Prisma/PostgreSQL, login por cookie JWT, roles, administración académica, clase virtual, PACEs, horarios/reservas, mensajería, calendario, notificaciones y captura GCR Teacher. |
| En validación | Integración completa de las pantallas web con estos servicios, control de acceso por flujo, descarga/carga de archivos con Supabase y pruebas de integración con base real. |
| Pendiente para primera producción | Infraestructura, secretos productivos, migraciones/seed operativo, cuentas externas, backup/observabilidad, E2E, política de archivos y decisión de capacidades/retención. |
| Mejora futura | Portal funcional Parent/Director, GCR de Dirección/Admin y exportes, correo/push, reportes, auditoría operativa ampliada y optimización según métricas reales. |

## 2. Stack exacto detectado

| Capa | Tecnología / estado |
| --- | --- |
| Monorepo | pnpm workspaces (`pnpm@11.7.0`), paquetes `apps/web`, `apps/api`, `packages/shared`. |
| Frontend | Next.js 15.5.19, React 19, TypeScript, Tailwind CSS, PostCSS y Lucide. |
| Backend | Node.js con NestJS 10, TypeScript, Passport JWT, class-validator/class-transformer, Helmet. |
| Base de datos | PostgreSQL 16 (Docker local incluido). |
| ORM y migraciones | Prisma 6; esquema, migraciones y seed en `apps/api/prisma`. |
| Contratos compartidos | `@homeschool/shared`: roles, permisos, tipos de aula, administración, horarios, PACEs, mensajería y calendario. |
| Almacenamiento de archivos | Abstracción propia: local para desarrollo o Supabase Storage privado para operación. |
| Autenticación | Contraseña con bcrypt; JWT firmado y entregado como cookie HTTP-only; Passport valida usuario activo y roles actuales en cada solicitud. |
| Pruebas | Node test runner, TypeScript como lint de tipos y scripts k6 de smoke/baseline. No hay suite E2E de navegador detectada. |

## 3. Roles reales y alcance

Los roles definidos y persistidos son `ADMIN`, `TEACHER`, `STUDENT`, `PARENT` y `DIRECTOR`.

| Rol | Alcance real en permisos y API |
| --- | --- |
| Admin | Administración de usuarios/roles, estructura académica, matrículas, asignación docente, PACEs, horarios, auditoría y acceso amplio a aula. Tiene interfaz administrativa conectada para años/períodos, usuarios, clases, materias, PACEs y familias. |
| Teacher | Ve sus clases, gestiona contenido, PACEs y calificaciones de estudiantes asignados; administra disponibilidad y reservas; usa mensajería y GCR Teacher. Las comprobaciones de pertenencia están en servicios para los flujos académicos revisados. |
| Student | Ve sus clases, PACEs, calificaciones, horario; solicita/cancela encuentros presenciales, entrega tareas y usa mensajería. Acceso limitado a sus matrículas/asignaciones. |
| Parent | Tiene perfil, relación estudiante-padre y permisos teóricos de consulta/comunicación. No se detectó portal funcional ni endpoints académicos completos específicos de Parent. |
| Director | Tiene perfil y permisos teóricos para informes académicos y conversaciones escaladas. No se detectaron rutas/pantallas API/web funcionales de Dirección para GCR o reportes. |

## 4. Inventario de módulos

`IMPLEMENTADO` significa modelo + API persistente disponibles; `PARCIAL` significa que parte relevante aún depende de UI mock, no tiene superficie institucional completa o requiere validación integrada.

| Módulo | Estado | Evidencia y alcance actual |
| --- | --- | --- |
| Autenticación y sesiones | IMPLEMENTADO | Login, logout y `me`; bcrypt, JWT de 24 h y cookie HTTP-only. No hay refresh token, recuperación de contraseña ni MFA. |
| Roles y permisos | IMPLEMENTADO | Guards JWT/roles/permisos y matriz compartida. La cobertura debe validarse por endpoint y rol antes de producción. |
| Administración académica | IMPLEMENTADO | Años/períodos, usuarios, clases, docentes, matrículas, materias, PACEs y vínculos familiares mediante API e interfaz Admin. Ajustes generales son una pantalla parcial. |
| Clases y matrículas | IMPLEMENTADO | Modelos de clase, docente, inscripción y control de pertenencia; API del aula. Existen pantallas antiguas mock además de las vistas conectadas. |
| Materias | IMPLEMENTADO | CRUD administrativo, asociación a clase y asignación de docente por materia. |
| Muro y comentarios | IMPLEMENTADO | Muro/comentarios de aula persistentes con control de acceso por clase. |
| Tareas y entregas | IMPLEMENTADO | Creación, adjuntos, entrega, listado, calificación y eliminación propia de entregas. Validar con usuarios reales y almacenamiento externo. |
| Materiales y archivos | PARCIAL | Carga/descarga/borrado de materiales de aula persistentes; endpoint genérico `/files` aún es un placeholder. Sin lista blanca de MIME ni antivirus. |
| Mensajería | IMPLEMENTADO | Conversaciones, participantes, mensajes, edición, borrado y escalamiento. Paginación de mensajes (límite 30) presente. Dirección escalada está prevista en permisos, no en superficie propia. |
| Escalamiento a Dirección | PARCIAL | La conversación puede marcarse como escalada y el rol posee permisos; falta consola/ruta de Dirección y validación de flujo institucional completo. |
| Horarios y disponibilidad | IMPLEMENTADO | Grilla, plantillas, publicación, disponibilidad docente y consultas de horario. Restricciones e índices para colisiones. |
| Solicitudes presenciales | IMPLEMENTADO | Estudiante reserva/cancela; Teacher aprueba/rechaza/reprograma; reglas de fecha y disponibilidad cubiertas por tests unitarios. |
| PACEs | IMPLEMENTADO | Catálogo, registros por estudiante, progreso, conciliación y calificaciones. Admin/Teacher/Student tienen API; hay tipos/datos mock heredados que no deben considerarse persistencia. |
| Calificaciones | PARCIAL | Calificación de PACEs y de entregas existe en API. Las vistas consolidadas/reportes y validación integral de reglas académicas quedan por confirmar. |
| GCR Teacher | IMPLEMENTADO | Apertura/borrador, asistencia, tareas, versículo, méritos/deméritos, envío, deadline 10:00 America/Panama, control de versión y auditoría transaccional. |
| GCR Dirección/Admin | PLANIFICADO | `docs/GCR_SPEC.md` lo define como superficie futura de cumplimiento, filtros, revisión y CSV; no hay endpoint/controlador ni pantalla implementada. |
| Calendario | PARCIAL | Lectura de eventos y creación desde la experiencia Teacher. Falta confirmar administración completa, edición/borrado, recurrencia y vistas por rol. |
| Notificaciones | PARCIAL | Persistencia, listado y marcado como leído. No hay proveedor de correo/push ni disparadores institucionales completos. |
| Exportaciones | PLANIFICADO | GCR_SPEC propone CSV seguro desde servidor; no hay exportador detectado. No se proponen PDF ni firma en el MVP. |
| Auditoría | PARCIAL | `AuditLog` y endpoint de consulta; GCR registra eventos detallados. Faltan política de retención, cobertura transversal y revisión de acceso/operación. |
| Responsive / mobile web | PARCIAL | Next/Tailwind y diseños responsivos en portales; build genera 38 rutas. No hay pruebas E2E/dispositivos ni aplicación móvil nativa. |

## 5. Supabase Storage y archivos

**Uso actual.** Sí: el código incluye un proveedor Supabase Storage configurable y el ejemplo de entorno lo selecciona. En ausencia de esa configuración, existe proveedor local para desarrollo. La integración no usa Supabase Auth ni Supabase Database.

| Aspecto | Estado |
| --- | --- |
| Bucket | Nombre configurable con `SUPABASE_STORAGE_BUCKET`; el ejemplo apunta al bucket privado previsto `homeschool-private`. No se expone ningún valor sensible. |
| Privacidad | Las descargas usan el endpoint autenticado de Storage a través de la API; no se generan URL públicas. API verifica acceso de usuario al material o entrega antes de leer el objeto. |
| Límite | 25 MiB por archivo; máximo 5 adjuntos por tarea o entrega. Material: un archivo por solicitud. |
| Tipos admitidos | No existe una allowlist de MIME/extensiones. Se acepta el MIME reportado por el cliente; es un riesgo pendiente. |
| Nombres y claves | Se normaliza el nombre y se usa UUID; se rechazan claves con rutas para reducir path traversal. |
| Riesgos pendientes | Sin antivirus/escaneo, lista de tipos, límite agregado por solicitud/usuario, monitoreo de cuota, lifecycle, reconciliación de objetos huérfanos ni prueba de recuperación. La API mantiene archivos en memoria durante la carga; tamaños mayores requieren estrategia streaming. |

**Estimación que debe solicitarse al cliente.** Cantidad de estudiantes/teachers activos, archivos mensuales por usuario, tamaño medio y máximo real, formatos, porcentaje de tareas con adjuntos, descargas mensuales, años de retención, requisitos de preservación legal y crecimiento anual. Con ello se calcula almacenamiento, egreso y margen de backup antes de elegir plan.

## 6. Servicios externos y propiedad recomendada

| Servicio | Uso / integración | Variables (solo nombres) | Costo y métrica | Propietario recomendado |
| --- | --- | --- | --- | --- |
| Supabase Storage | Archivos privados de materiales y entregas; integración de código disponible. | `STORAGE_DRIVER`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Potencial: GB almacenados, egreso/descargas, operaciones y plan. | Cliente, con acceso técnico delegado al desarrollador. |
| Frontend hosting | Sitio Next.js. No hay proveedor configurado. Opciones: Vercel, Netlify, Cloudflare Pages o servidor propio. | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_ENABLE_DEMO_DATA` | Tráfico, builds, funciones/edge, ancho de banda y dominios. | Cliente. |
| API/backend hosting | Servicio NestJS. No hay proveedor configurado. Opciones: Render, Railway, Fly.io, contenedor en nube o servidor administrado. | `NODE_ENV`, `API_PORT`, `API_PREFIX`, `WEB_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DATABASE_URL` | Horas/CPU/RAM, tráfico, conexiones, logs y transferencia. | Cliente. |
| PostgreSQL | Datos transaccionales. Docker solo cubre desarrollo local. Puede ser PostgreSQL administrado o servidor propio. | `DATABASE_URL` | CPU/RAM, almacenamiento, IOPS, conexiones, réplicas y backups. | Cliente. |
| Dominio y DNS | Dominio institucional, DNS, TLS y orígenes CORS. No configurado. | `WEB_ORIGIN`, `NEXT_PUBLIC_API_URL` | Renovación del dominio, DNS/SSL administrado y servicios opcionales. | Cliente. |
| Correo transaccional | Recuperación de acceso, alertas, GCR y comunicaciones. No integrado. | Por definir al elegir proveedor; no crear credenciales en el repositorio. | Correos enviados, contactos y retención de eventos. | Cliente. |
| Monitoreo/logging | Logger estructurado local en API; sin plataforma externa detectada. Ejemplos: Sentry, Axiom, Datadog, Grafana/Cloud logging. | Por definir según proveedor. | Eventos, retención, trazas, alertas y usuarios. | Cliente. |
| Backups | Volumen Docker local no equivale a backup productivo. Sin automatización externa detectada. | Depende del proveedor de DB/Storage. | Copias, retención, restauraciones, región y egreso. | Cliente, con política aprobada por institución. |

Los precios, límites gratuitos, regiones y términos de los proveedores deben cotizarse con información vigente al momento de la propuesta; este repositorio no fija un proveedor ni permite estimar costo real sin capacidad esperada.

## 7. Despliegue y requisitos mínimos de infraestructura

### Componentes a desplegar

1. Web Next.js (`apps/web`).
2. API NestJS (`apps/api`), expuesta por HTTPS tras proxy/plataforma.
3. PostgreSQL persistente con migraciones Prisma aplicadas.
4. Bucket privado de archivos, si se habilitan cargas.
5. DNS/dominio, TLS, backup y observabilidad.

Existe `docker-compose.yml` solo para PostgreSQL local. Hay scripts de build, migración de despliegue (`prisma migrate deploy`) y health/readiness en API, pero no hay Dockerfile de aplicación, manifiestos cloud, CI/CD, IaC, configuración de dominio, gestión de secretos ni runbook de producción.

**Mínimo inicial razonable (a validar por carga):** una instancia/API administrada con al menos 1 vCPU y 1–2 GB RAM, PostgreSQL administrado con almacenamiento SSD, bucket privado, HTTPS, límites de conexiones, backups diarios y retención definida. No es una especificación final: la capacidad debe dimensionarse con los supuestos de la sección 11 y pruebas de carga en entorno no productivo.

## 8. Seguridad implementada y límites

| Control | Implementado | Pendiente / límite |
| --- | --- | --- |
| Hashing | bcrypt para contraseñas. | Política de complejidad, reset y MFA no detectados. |
| Sesión | JWT firmado; cookie HTTP-only, `SameSite=Lax`, `Secure` en producción; expiración configurable. | Sin rotación/refresh/revocación explícita ni CSRF específico documentado. |
| Autorización | Guards JWT, roles/permisos; servicios verifican asignación, matrícula/participación en flujos revisados. | Revisión de matriz por endpoint, pruebas negativas E2E y aislamiento multirol. |
| Validación | `ValidationPipe` global con whitelist y rechazo de campos no permitidos; DTOs con class-validator. | Pruebas de abuso y límites de payload adicionales. |
| Archivos | Bucket autenticado, proxy por API y comprobación de acceso antes de descarga. | Falta allowlist MIME, antivirus, cuota y límites globales. |
| Auditoría | Modelo general y trazabilidad granular GCR con transacciones. | Retención, acceso, exportación y cobertura general por definir. |
| Rate limiting | Middleware en memoria: 240 solicitudes/minuto por ruta/IP, login 10/minuto. | No distribuido entre réplicas, sin almacenamiento compartido ni protección WAF. |
| HTTP/CORS | Helmet y CORS por `WEB_ORIGIN`, con credenciales. | Definir orígenes definitivos y cabeceras/proxy de producción. |

## 9. Pruebas y calidad comprobadas

Se ejecutó localmente el 11 de julio de 2026, sin modificar código:

| Comando | Resultado |
| --- | --- |
| `pnpm lint` | Correcto: verificación TypeScript en shared, API y web. |
| `pnpm test` | Correcto: web 3/3; API 9/9 ejecutados. Tres pruebas de API fueron omitidas porque requieren base de datos/integración: flujo GCR, migraciones/integridad y flujo horario-reserva. |
| `pnpm build` | Correcto: shared, API y build optimizado de Next.js; 38 rutas web generadas. |
| k6 | Existen scripts `load:smoke` y `load:baseline`; no se ejecutaron en esta revisión. |
| E2E | Pendiente: no se detectó suite de navegador ni ejecución contra entorno integrado. |

## 10. Riesgos y pendientes antes de producción

1. Completar validación de pantallas conectadas y retirar/aislar vistas mock para evitar expectativas de persistencia inexistente.
2. Definir e implementar despliegue, CI/CD, secretos, dominios, TLS, CORS y configuración por ambiente.
3. Configurar Supabase Storage real, bucket privado, cuotas, antivirus/lista de tipos y prueba de restauración.
4. Ejecutar las pruebas de integración omitidas con PostgreSQL efímero/no productivo, y añadir E2E de los flujos críticos por rol.
5. Establecer backup cifrado, retención, restauración probada y responsable institucional para PostgreSQL y archivos.
6. Resolver GCR Dirección/Admin, exportación CSV y criterios institucionales aún descritos como futuros en `GCR_SPEC.md`.
7. Integrar correo/push o dejar explícitamente fuera del lanzamiento; las notificaciones actuales son internas.
8. Revisar hardening: recuperación de contraseña, CSRF/rate limiting distribuido, monitoreo, respuesta a incidentes y política de auditoría/privacidad.
9. Formalizar calendario lectivo: GCR usa por ahora el siguiente día calendario en una regla de deméritos donde la especificación pide día lectivo.
10. Realizar baseline k6 y dimensionamiento antes de liberar, sin probar carga contra producción.

## 11. Preguntas técnicas pendientes para la institución

1. ¿Cuántos estudiantes, teachers, administradores, padres y directivos habrá al lanzamiento y a tres años?
2. ¿Cuál es el máximo de usuarios concurrentes esperado por franja horaria y durante entregas/reportes?
3. ¿Cuántos archivos se cargarán al mes, cuál será su tamaño promedio/máximo y qué formatos son obligatorios?
4. ¿Cuántos años debe retenerse cada tipo de dato, archivo, conversación, nota y auditoría?
5. ¿Cuántos GCR diarios se esperan y cuáles son las reglas finales de día lectivo, corrección, aprobación y detención?
6. ¿Se requiere correo transaccional, push, ambos, o solo notificaciones dentro de la plataforma? ¿Quién aprueba los mensajes?
7. ¿Qué política de backup, RPO/RTO, región de datos y procedimiento de restauración exige la institución?
8. ¿La institución proveerá y será propietaria de dominio, nube, Supabase, base de datos, correo y monitoreo?
9. ¿Qué requisitos de privacidad, consentimiento parental, acceso a datos y auditoría aplican a estudiantes?
10. ¿Qué reportes/exportaciones son obligatorios en la primera producción y quién puede generarlos?
11. ¿Qué navegadores, dispositivos móviles y conectividad mínima deben soportarse?
12. ¿Qué horario académico, festivos y zonas horarias institucionales rigen para calendario, reservas y GCR?

## 12. Alcance revisado

Este inventario se elaboró únicamente a partir de `apps/api/**`, `apps/web/**`, `packages/shared/**`, Prisma schema/seed, `docker-compose.yml`, archivos `package.json`, ejemplos `.env`, `docs/GCR_SPEC.md` y `AGENTS.md`. No se realizaron cambios de código ni se revisaron fuentes fuera de ese alcance.

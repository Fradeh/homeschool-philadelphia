# Homeschool Platform

Plataforma web escolar colaborativa para una escuela privada/Home School. La base inicial cubre comunicacion por grupos, usuarios, roles, publicaciones, comentarios, archivos, calendario, notificaciones y auditoria basica.

No incluye app movil, videollamadas, clases en vivo ni chat en tiempo real. La arquitectura deja un modulo `RealtimeModule` reservado para WebSockets en una fase posterior.

## Stack

- Monorepo con pnpm workspaces
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript, REST
- Base de datos: PostgreSQL
- ORM: Prisma
- Contratos compartidos: `packages/shared`

## Estructura

```txt
homeschool-platform/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── shared/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

## Requisitos

- Node.js 22+
- pnpm 11+
- Docker Desktop, o una instancia local de PostgreSQL

## Configuracion inicial

Desde la raiz del proyecto:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
docker compose up -d
pnpm db:generate
pnpm db:migrate
```

## Desarrollo

Levantar frontend y backend juntos:

```bash
pnpm dev
```

Servicios por defecto:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Readiness con base de datos: `http://localhost:4000/api/health/readiness`
- PostgreSQL: `localhost:5432`

Tambien puedes levantar cada app por separado:

```bash
pnpm dev:web
pnpm dev:api
```

## Prisma

El schema vive en:

```txt
apps/api/prisma/schema.prisma
```

Comandos utiles:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:deploy
pnpm db:seed
```

En producción se usa exclusivamente `pnpm db:deploy`. Consulta [docs/deployment.md](docs/deployment.md) para staging, backups y rollback.

El seed es únicamente local, es idempotente y exige `SEED_ADMIN_EMAIL`, `SEED_TEACHER_EMAIL`, `SEED_STUDENT_EMAIL` y `SEED_DEFAULT_PASSWORD`. La aceptación de la V1 se registra en [docs/v1-checklist.md](docs/v1-checklist.md).

## Arquitectura

- El frontend nunca se conecta directamente a PostgreSQL.
- El frontend consume la API REST del backend mediante `NEXT_PUBLIC_API_URL`.
- El backend concentra autenticacion, permisos, validaciones, logica de negocio y acceso a datos.
- Prisma solo se configura dentro de `apps/api`.
- Tipos, enums y contratos compartidos viven en `packages/shared`.
- Variables sensibles deben ir en `.env`, nunca en codigo fuente.
- `apps/web` y `apps/api` pueden desplegarse por separado.

## Modulos iniciales del backend

- `auth`: login, JWT strategy y guard base.
- `users`: estructura inicial para usuarios.
- `roles`: roles iniciales y base de permisos.
- `admin`: rutas administrativas protegidas.
- `groups`: espacios de comunicacion.
- `posts`: publicaciones y comentarios.
- `files`: metadatos de archivos, storage pendiente.
- `calendar`: eventos generales o asociados a grupos.
- `notifications`: estructura para notificaciones internas.
- `audit`: consulta inicial de acciones importantes.
- `realtime`: placeholder para WebSockets futuros.

## Roles iniciales

- `ADMIN`
- `TEACHER`
- `STUDENT`
- `PARENT`
- `DIRECTOR`

## Responsabilidades por rol

- `ADMIN`: configura usuarios, clases, matriculas, ligas padre-alumno, asignaciones profesor-clase, materias/PACEs y auditoria.
- `TEACHER`: trabaja sobre sus clases asignadas, gestiona contenido, avanza PACEs, califica y se comunica con contactos academicos permitidos.
- `STUDENT`: consulta sus clases, PACEs, notas, tareas, recursos, calendario y mensajes.
- `PARENT`: consulta informacion academica autorizada de sus hijos y recibe comunicaciones oficiales.
- `DIRECTOR`: revisa reportes academicos y participa en conversaciones escaladas.

## Nota de autenticacion

El login actual es una base de integracion y emite un token de prueba para facilitar el desarrollo temprano. La siguiente fase debe conectar `AuthService` con usuarios reales, hashing de passwords, asignacion de roles y permisos persistidos.

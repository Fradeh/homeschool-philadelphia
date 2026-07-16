---
name: mvp-persistence-fixer
description: Use this skill to fix MVP actions that are LOCAL, MOCK, or ROTA in HomeSchool-Philadelphia. It focuses on making visible Teacher and Student actions persist through real API, backend, and database flows, or disabling misleading actions when real persistence does not exist.
---

# MVP Persistence Fixer

Use this skill when the user asks to correct MVP actions that are LOCAL, MOCK, or ROTA, especially in Teacher and Student flows.

## Goal

Fix visible MVP actions so they either persist through the real backend/database or are clearly disabled/removed if real persistence does not exist.

The main goal is to avoid UI actions that appear to work but are lost after refresh.

## Typical scope

Only inspect the module requested by the user.

Common areas:
- apps/web/features/teacher/**
- apps/web/features/student/**
- apps/web/features/communication/**
- apps/web/lib/api-client.ts
- apps/api/src/modules/classroom/**
- apps/api/src/modules/schedules/**
- apps/api/src/modules/academic-paces/**
- apps/api/src/modules/conversations/**
- apps/api/prisma/schema.prisma
- packages/shared/src/**

## Strict rules

- Do not perform a global audit.
- Do not inspect unrelated modules.
- Do not redesign the general UI.
- Do not touch login, admin, calendar, students, assignments, PACEs, files, or messages unless the task explicitly mentions them.
- Do not use mocks as persistence.
- Do not use local state as real persistence.
- Do not invent endpoints if a proper endpoint already exists.
- Do not add new libraries unless strictly necessary.
- Do not edit existing applied migrations.
- If schema.prisma must change, stop first and propose the schema change before creating a migration.
- Keep lint/build passing.

## Work method

1. Identify the visible action mentioned by the user.
2. Locate the active frontend component.
3. Check whether an API client function already exists.
4. Check whether a backend endpoint already exists.
5. Check whether the Prisma model already supports the needed persistence.
6. Implement the smallest safe change.
7. Refresh or revalidate the UI after saving.
8. Show real API errors clearly.
9. If real persistence does not exist, remove, disable, or relabel the misleading action.

## Success criteria

The action is fixed when:
- It persists through the backend/database, or it is clearly disabled/not available.
- It does not depend on mocks.
- It is not lost after refresh.
- It does not change unrelated modules.
- The app compiles.

## Final response format

Respond with:

- Modified files.
- Endpoints used or created.
- Data model used.
- Working flow.
- What was not touched.
- Manual test steps.
- Commands to validate lint/build/test.
- Remaining risks.
---
name: storage-durable-migration
description: Use this skill to migrate HomeSchool-Philadelphia file handling from local uploads to a durable private storage abstraction without breaking existing classroom material upload/download flows.
---

# Storage Durable Migration

Use this skill when working on file upload/download persistence, storage abstraction, local storage replacement, S3-compatible storage, Supabase Storage, or private material downloads.

## Goal

Move file handling away from direct local filesystem usage toward a durable private storage design, without breaking existing classroom material upload/download routes.

The system must protect academic files and avoid public permanent URLs.

## Current known context

HomeSchool-Philadelphia currently uploads materials through:

- POST /classroom/classes/:classId/materials
- GET /classroom/materials/:id/download

Files are currently stored under local uploads using storageKey metadata in PostgreSQL.

ClassMaterial already has:
- storageKey
- name
- mimeType
- sizeBytes
- externalUrl
- visibility fields and class relations

The frontend should not need changes for the first storage abstraction phase.

## Strict rules

- Do not perform a global audit.
- Do not touch unrelated modules.
- Do not change frontend unless the task explicitly asks.
- Do not change Prisma schema unless explicitly approved.
- Do not create or edit migrations unless explicitly approved.
- Do not expose private files through permanent public URLs.
- Do not bypass existing authorization checks.
- Student downloads must respect visibleToStudents.
- Keep existing routes stable.
- Keep local storage working for development unless the task explicitly removes it.
- Do not migrate existing files unless the task explicitly asks.
- Keep lint/build/test passing.

## Work method

1. Identify the current file operation being changed.
2. Preserve current API routes and external behavior.
3. Introduce or use StorageService abstraction.
4. Keep provider-specific logic outside ClassroomService when possible.
5. Validate authorization before returning files or signed URLs.
6. Prefer streams or buffers safely; avoid unnecessary memory usage when practical.
7. Keep storage keys stable.
8. Do the smallest safe change for the requested phase.
9. Report any deployment or data-migration risk.

## Recommended phases

### Phase 3A: StorageService local abstraction

Create StorageService and LocalStorageService.
Replace direct writeFile/readFile calls in classroom materials with StorageService.
Keep local uploads behavior.
Fix visibleToStudents validation on direct download.

### Phase 3B: Durable provider

Add S3-compatible or Supabase provider behind StorageService.
Use environment variables.
Keep local as development fallback.
Keep routes unchanged.

### Phase 3C: Existing files migration

Create a script or documented process to copy existing uploads to the durable bucket while preserving storageKey.
Do not delete local files until verification passes.

## Final response format

Respond with:

- Modified files.
- Storage provider or abstraction used.
- Routes preserved.
- Authorization checks preserved or improved.
- Environment variables added.
- Migration required or not.
- Manual test steps.
- Validation commands.
- Remaining risks.
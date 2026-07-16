---
name: performance-mvp-optimizer
description: Use this skill to improve MVP performance in HomeSchool-Philadelphia through measured, minimal changes: indexing, query reduction, pagination, caching, async jobs, and load testing.
---

# Performance MVP Optimizer

Use this skill when working on performance, indexing, caching, async processing, pagination, query optimization, load testing, or scalability of the MVP.

## Goal

Improve performance safely through measured, minimal changes. Do not introduce Redis, queues, indexes, or caching without a clear reason.

## Strict rules

- Do not perform a global audit unless requested.
- Do not optimize unrelated modules.
- Do not add Redis unless metrics justify it.
- Do not add all indexes blindly.
- Do not cache sensitive or fast-changing data without invalidation.
- Do not cache permissions, grades, reservations, submissions, or private messages unless explicitly approved.
- Do not run destructive load tests.
- Do not run load tests against production.
- Do not edit existing migrations.
- If schema/index changes are needed, create a new migration only when approved.
- Keep lint/build/test passing.

## Priorities

1. Measure before optimizing when practical.
2. Reduce oversized payloads.
3. Add pagination.
4. Remove N+1 queries.
5. Move write-heavy reconciliation out of GET requests.
6. Add only justified indexes.
7. Add minimal safe caching.
8. Use async jobs only for non-critical or retryable work.

## Safe caching candidates

- Academic levels.
- Published schedule templates.
- Static catalog/config data.
- Short-lived summaries with clear invalidation.

## Avoid caching

- Auth/session.
- Permissions.
- Grades.
- Submissions.
- Reservations.
- Conversations.
- Private downloads.
- Full class workspaces.

## Load testing rules

Start with smoke and baseline tests.
Use realistic but safe traffic.
Measure p95, p99, error rate, response size, memory, DB pool usage, and storage latency.
Do not simulate heavy traffic against production.

## Final response format

Respond with:

- Modified files.
- Performance issue addressed.
- Why this change matters.
- What was not touched.
- How to test manually.
- How to validate with commands.
- Metrics or expected improvement.
- Remaining risks.
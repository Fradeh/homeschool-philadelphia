-- Keep the suggested recess rows visually identifiable, but let them contain schedule blocks.
UPDATE "SchedulePeriod" SET "startTime" = '07:00', "endTime" = '07:50' WHERE "id" = 'period-01';
UPDATE "SchedulePeriod" SET "kind" = 'BREAK', "label" = 'RECESS SUGGESTED' WHERE "id" = 'period-05';
UPDATE "SchedulePeriod" SET "startTime" = '12:30', "endTime" = '13:10', "kind" = 'INSTRUCTIONAL', "label" = NULL WHERE "id" = 'period-09';
UPDATE "SchedulePeriod" SET "startTime" = '13:10', "endTime" = '13:20', "kind" = 'BREAK', "label" = 'RECESS SUGGESTED' WHERE "id" = 'period-10';
UPDATE "SchedulePeriod" SET "startTime" = '13:20', "endTime" = '14:10', "kind" = 'INSTRUCTIONAL', "label" = NULL WHERE "id" = 'period-11';

INSERT INTO "SchedulePeriod" ("id", "gridId", "order", "startTime", "endTime", "kind", "label")
SELECT 'period-12', 'institutional-grid-v1', 12, '14:10', '15:30', 'INSTRUCTIONAL', NULL
WHERE NOT EXISTS (SELECT 1 FROM "SchedulePeriod" WHERE "id" = 'period-12');
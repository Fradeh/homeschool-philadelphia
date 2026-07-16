const test = require("node:test");
const assert = require("node:assert/strict");
const { Weekday } = require("@prisma/client");
const { SchedulesService } = require("../src/modules/schedules/schedules.service");

function dateOnly(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

test("booking date accepts an enabled weekday in the current or next month", () => {
  const service = new SchedulesService({});
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  const weekday = [undefined, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY][date.getDay()];
  const result = service.validateBookingDate(dateOnly(date), weekday);
  assert.equal(result.toISOString().slice(0, 10), dateOnly(date));
});

test("booking date rejects a date after the next calendar month", () => {
  const service = new SchedulesService({});
  const date = new Date();
  date.setMonth(date.getMonth() + 3, 1);
  assert.throws(() => service.validateBookingDate(dateOnly(date), Weekday.MONDAY), /current and next month/);
});

test("booking date rejects a past date", () => {
  const service = new SchedulesService({});
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const weekday = [undefined, Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY][date.getDay()] || Weekday.MONDAY;
  assert.throws(() => service.validateBookingDate(dateOnly(date), weekday), /current and next month/);
});

test("booking date rejects a weekday that was not published", () => {
  const service = new SchedulesService({});
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() !== 1) date.setDate(date.getDate() + 1);
  assert.throws(() => service.validateBookingDate(dateOnly(date), Weekday.TUESDAY), /does not match/);
});

test("publishing rejects an incomplete weekly grid", async () => {
  const prisma = {
    scheduleTemplate: {
      findUnique: async () => ({
        id: "template", academicYearId: "year", gradeLevel: {}, grid: { periods: [{ id: "period", kind: "INSTRUCTIONAL" }] }, blocks: []
      })
    }
  };
  const service = new SchedulesService(prisma);
  await assert.rejects(() => service.publish("template"), /requires 5 cells/);
});

test("publishing rejects a teacher collision with another grade", async () => {
  const blocks = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"].map((weekday) => ({ teacherId: "teacher", weekday, periodId: "period", period: { startTime: "07:00", endTime: "07:50" } }));
  const prisma = {
    scheduleTemplate: {
      findUnique: async () => ({ id: "template", academicYearId: "year", gradeLevel: {}, grid: { periods: [{ id: "period", kind: "INSTRUCTIONAL" }] }, blocks })
    },
    scheduleTemplateBlock: {
      findFirst: async () => ({ template: { gradeLevel: { name: "Séptimo" } } })
    }
  };
  const service = new SchedulesService(prisma);
  await assert.rejects(() => service.publish("template"), /Teacher conflict/);
});

test("creating a teacher schedule reuses the existing template and adds subject scopes", async () => {
  const createdScopes = [];
  const prisma = {
    scheduleGrid: {
      findFirst: async () => ({ id: "grid", periods: [], version: 1 })
    },
    teacherProfile: {
      findUnique: async () => ({ id: "teacher" })
    },
    classSubject: {
      findMany: async () => [{ id: "subject-a" }, { id: "subject-b" }]
    },
    $transaction: async (callback) => callback({
      classSubjectTeacher: { upsert: async () => ({}) },
      scheduleTemplate: {
        findUnique: async () => ({ id: "existing-template" }),
        update: async ({ data }) => {
          createdScopes.push(...data.subjectScopes.createMany.data.map((item) => item.classSubjectId));
          return {
            id: "existing-template",
            academicYearId: "year",
            audienceType: "TEACHER",
            name: data.name,
            status: "DRAFT",
            publishedAt: null,
            gradeLevel: null,
            class: null,
            teacher: { id: "teacher", user: { firstName: "Laura", lastName: "Gómez" } },
            subjectScopes: [],
            grid: { id: "grid", name: "Grid", version: 1, isActive: true, periods: [] },
            blocks: []
          };
        }
      }
    })
  };
  const service = new SchedulesService(prisma);
  const result = await service.createTemplate({
    academicYearId: "year",
    audienceType: "TEACHER",
    teacherId: "teacher",
    classSubjectIds: ["subject-a", "subject-b"],
    name: "Horario actualizado"
  });

  assert.equal(result.id, "existing-template");
  assert.deepEqual(createdScopes, ["subject-a", "subject-b"]);
});

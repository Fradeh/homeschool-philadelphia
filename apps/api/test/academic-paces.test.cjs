const test = require("node:test");
const assert = require("node:assert/strict");
const { AcademicPacesService } = require("../src/modules/academic-paces/academic-paces.service");

test("teacher plans PACE numbers from the student's current number", async () => {
  const prisma = {
    studentPaceGoal: {
      findMany: async () => [{
        studentId: "student-1",
        classSubjectId: "class-subject-1",
        academicTermId: "term-1",
        targetPaces: 3,
        startingPaceNumber: 101,
        classSubject: { subject: { id: "subject-1" } }
      }]
    }
  };
  const service = new AcademicPacesService(prisma);

  const plan = await service.getTeacherRecordCandidates("teacher-1", "term-1");

  assert.deepEqual(plan.candidates.map((item) => item.paceNumber), [101, 102, 103]);
  assert.deepEqual(plan.candidates.map((item) => item.status), ["CURRENT", "PLANNED", "PLANNED"]);
  assert.equal(plan.skippedCount, 0);
});

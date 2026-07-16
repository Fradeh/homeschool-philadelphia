const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const v1Files = [
  "app/student/dashboard/page.tsx",
  "app/student/classes/page.tsx",
  "app/student/classes/[classId]/page.tsx",
  "app/teacher/dashboard/page.tsx",
  "app/teacher/classes/page.tsx",
  "app/teacher/classes/[classId]/page.tsx",
  "features/student/dashboard/StudentDashboardV1.tsx",
  "features/student/classes/StudentClassesPage.tsx",
  "features/student/classes/StudentClassWorkspacePage.tsx",
  "features/teacher/dashboard/TeacherDashboardV1.tsx",
  "features/teacher/classes/TeacherClassesPage.tsx",
  "features/teacher/classes/TeacherClassWorkspacePage.tsx",
  "features/student/assignments/StudentAssignmentsPage.tsx",
  "features/student/files/StudentFilesPage.tsx",
  "features/teacher/assignments/TeacherAssignmentsPage.tsx",
  "features/teacher/files/TeacherFilesPage.tsx"
];

test("accessible homeschool routes do not import mock records", () => {
  for (const file of v1Files) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /import\s+\{[^}]*\b(teacherClasses|studentClasses|studentAssignments|studentUser)\b[^}]*\}\s+from\s+["'][^"']*mock-/, file);
  }
});

test("homeschool task and file routes are active instead of demo-gated", () => {
  for (const file of ["app/student/assignments/page.tsx", "app/student/files/page.tsx", "app/teacher/assignments/page.tsx", "app/teacher/files/page.tsx"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /demoDataEnabled/, file);
    assert.doesNotMatch(source, /redirect\(/, file);
  }
});

test("standalone meeting routes redirect into the academic schedule", () => {
  for (const role of ["student", "teacher"]) {
    const source = fs.readFileSync(path.join(root, `app/${role}/meetings/page.tsx`), "utf8");
    assert.match(source, new RegExp(`redirect\\(\"/${role}/schedule\"\\)`));
  }
});

test("administrative teacher routes use role gates and real API-backed workspaces", () => {
  const complianceRoute = fs.readFileSync(path.join(root, "app/teacher/gcr-compliance/page.tsx"), "utf8");
  const escalationsRoute = fs.readFileSync(path.join(root, "app/teacher/escalations/page.tsx"), "utf8");
  const compliancePage = fs.readFileSync(path.join(root, "features/administrative/GcrCompliancePage.tsx"), "utf8");

  assert.match(complianceRoute, /UserRole\.ADMINISTRATIVE/);
  assert.match(escalationsRoute, /UserRole\.ADMINISTRATIVE/);
  assert.match(escalationsRoute, /role="administrative"/);
  assert.match(compliancePage, /getGcrCompliance/);
  assert.doesNotMatch(compliancePage, /mock-/);
});

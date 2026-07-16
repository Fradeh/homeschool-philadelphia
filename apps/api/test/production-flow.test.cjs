const test = require("node:test");
const assert = require("node:assert/strict");
const { ValidationPipe } = require("@nestjs/common");
const { NestFactory } = require("@nestjs/core");
const { PrismaClient } = require("@prisma/client");
const { AppModule } = require("../src/app.module");

test("ADMIN configures schedule, teacher publishes availability, student books and teacher approves", { skip: process.env.RUN_E2E !== "1", timeout: 60_000 }, async () => {
  const prisma = new PrismaClient();
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.listen(0, "127.0.0.1");
  const address = app.getHttpServer().address();
  const base = `http://127.0.0.1:${address.port}/api`;
  const suffix = Date.now();
  const password = "ProductionFlow123!";

  async function request(path, init = {}, cookie) {
    const response = await fetch(`${base}${path}`, { ...init, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...init.headers } });
    const body = response.status === 204 ? undefined : await response.json();
    if (!response.ok) throw new Error(`${init.method || "GET"} ${path}: ${response.status} ${JSON.stringify(body)}`);
    return { body, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }

  async function login(email) {
    return (await request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) })).cookie;
  }

  try {
    const hash = await require("bcrypt").hash(password, 10);
    const adminRole = await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } });
    const adminEmail = `admin-${suffix}@test.local`;
    await prisma.user.create({ data: { email: adminEmail, passwordHash: hash, firstName: "Admin", lastName: "E2E", roles: { create: { roleId: adminRole.id } } } });
    const adminCookie = await login(adminEmail);

    const grade = (await request("/admin/grade-levels", { method: "POST", body: JSON.stringify({ code: `E2E-${suffix}`, name: "Sexto E2E", sortOrder: 100000 + (suffix % 100000) }) }, adminCookie)).body;
    const year = (await request("/admin/academic-years", { method: "POST", body: JSON.stringify({ name: `E2E-${suffix}`, startsAt: "2026-01-01", endsAt: "2026-12-31", isActive: true }) }, adminCookie)).body;
    const teacherEmail = `teacher-${suffix}@test.local`;
    const studentEmail = `student-${suffix}@test.local`;
    const teacher = (await request("/admin/academic-users", { method: "POST", body: JSON.stringify({ email: teacherEmail, firstName: "Teacher", lastName: "E2E", password, role: "TEACHER", employeeCode: `T-${suffix}` }) }, adminCookie)).body;
    const student = (await request("/admin/academic-users", { method: "POST", body: JSON.stringify({ email: studentEmail, firstName: "Student", lastName: "E2E", password, role: "STUDENT", studentCode: `S-${suffix}`, gradeLevelId: grade.id }) }, adminCookie)).body;
    let schoolClass = (await request("/admin/classes", { method: "POST", body: JSON.stringify({ academicYearId: year.id, gradeLevelId: grade.id, name: "Sexto E2E", code: `C-${suffix}` }) }, adminCookie)).body;
    const unrelatedClass = (await request("/admin/classes", { method: "POST", body: JSON.stringify({ academicYearId: year.id, gradeLevelId: grade.id, name: "Clase no asignada", code: `OTHER-${suffix}` }) }, adminCookie)).body;
    const subject = (await request("/admin/subjects", { method: "POST", body: JSON.stringify({ name: `Math E2E ${suffix}`, shortName: `M${String(suffix).slice(-6)}` }) }, adminCookie)).body;
    schoolClass = (await request(`/admin/classes/${schoolClass.id}/teachers`, { method: "POST", body: JSON.stringify({ teacherProfileId: teacher.teacherProfileId }) }, adminCookie)).body;
    schoolClass = (await request(`/admin/classes/${schoolClass.id}/students`, { method: "POST", body: JSON.stringify({ studentProfileId: student.studentProfileId }) }, adminCookie)).body;
    schoolClass = (await request(`/admin/classes/${schoolClass.id}/subjects`, { method: "POST", body: JSON.stringify({ subjectId: subject.id }) }, adminCookie)).body;
    const classSubjectId = schoolClass.subjects[0].id;
    await request(`/admin/class-subjects/${classSubjectId}/teachers`, { method: "POST", body: JSON.stringify({ teacherProfileId: teacher.teacherProfileId }) }, adminCookie);

    const template = (await request("/admin/schedule-templates", { method: "POST", body: JSON.stringify({ academicYearId: year.id, gradeLevelId: grade.id, name: "Horario Sexto E2E" }) }, adminCookie)).body;
    const grid = (await request("/admin/schedule-grid", {}, adminCookie)).body;
    const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
    const blocks = grid.periods.filter((period) => period.kind === "INSTRUCTIONAL").flatMap((period) => weekdays.map((weekday) => ({ periodId: period.id, weekday, kind: "EMPTY" })));
    await request(`/admin/schedule-templates/${template.id}/blocks`, { method: "PUT", body: JSON.stringify({ blocks }) }, adminCookie);
    const published = (await request(`/admin/schedule-templates/${template.id}/publish`, { method: "POST" }, adminCookie)).body;
    assert.equal(published.status, "PUBLISHED");

    const teacherCookie = await login(teacherEmail);
    const teacherDashboard = (await request("/teacher/dashboard", {}, teacherCookie)).body;
    assert.equal(teacherDashboard.classes.length, 1);
    await assert.rejects(() => request(`/teacher/classes/${unrelatedClass.id}`, {}, teacherCookie), /404/);
    const next = nextWeekday();
    const slot = (await request("/teacher/availability", { method: "POST", body: JSON.stringify({ classSubjectId, weekday: next.weekday, startTime: "09:00", endTime: "09:40", location: "Campus" }) }, teacherCookie)).body;
    const studentCookie = await login(studentEmail);
    const studentDashboard = (await request("/student/dashboard", {}, studentCookie)).body;
    assert.equal(studentDashboard.classes.length, 1);
    assert.equal(studentDashboard.hasPublishedSchedule, true);
    const classDetail = (await request(`/student/classes/${schoolClass.id}`, {}, studentCookie)).body;
    assert.equal(classDetail.id, schoolClass.id);
    await assert.rejects(() => request(`/student/classes/${unrelatedClass.id}`, {}, studentCookie), /404/);
    const booking = (await request(`/student/subjects/${classSubjectId}/bookings`, { method: "POST", body: JSON.stringify({ availabilitySlotId: slot.id, scheduledDate: next.date, studentNote: "E2E" }) }, studentCookie)).body;
    assert.equal(booking.status, "PENDING");
    await assert.rejects(() => request(`/student/subjects/${classSubjectId}/bookings`, { method: "POST", body: JSON.stringify({ availabilitySlotId: slot.id, scheduledDate: next.date }) }, studentCookie), /409/);
    const approved = (await request(`/teacher/bookings/${booking.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED" }) }, teacherCookie)).body;
    assert.equal(approved.status, "APPROVED");
    await assert.rejects(() => request(`/teacher/bookings/${booking.id}/status`, { method: "PATCH", body: JSON.stringify({ status: "REJECTED", teacherResponse: "late" }) }, teacherCookie), /409/);
    const studentBookings = (await request("/student/bookings", {}, studentCookie)).body;
    assert.equal(studentBookings.find((item) => item.id === booking.id).status, "APPROVED");
    const notifications = (await request("/notifications", {}, studentCookie)).body.items;
    const approvalNotification = notifications.find((item) => item.title === "Reserva aprobada");
    assert.ok(approvalNotification);
    await assert.rejects(() => request(`/notifications/${approvalNotification.id}/read`, { method: "PATCH" }, teacherCookie), /404/);
    const readNotification = (await request(`/notifications/${approvalNotification.id}/read`, { method: "PATCH" }, studentCookie)).body;
    assert.ok(readNotification.readAt);
    const cancelled = (await request(`/student/bookings/${booking.id}/cancel`, { method: "PATCH" }, studentCookie)).body;
    assert.equal(cancelled.status, "CANCELLED");
  } finally {
    await app.close();
    await prisma.academicYear.deleteMany({ where: { name: `E2E-${suffix}` } });
    await prisma.user.deleteMany({ where: { email: { in: [`admin-${suffix}@test.local`, `teacher-${suffix}@test.local`, `student-${suffix}@test.local`] } } });
    await prisma.subject.deleteMany({ where: { name: `Math E2E ${suffix}` } });
    await prisma.gradeLevel.deleteMany({ where: { code: `E2E-${suffix}` } });
    await prisma.$disconnect();
  }
});

function nextWeekday() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  while (date.getDay() === 0 || date.getDay() === 6) date.setDate(date.getDate() + 1);
  const weekdays = [null, "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
  return { weekday: weekdays[date.getDay()], date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` };
}

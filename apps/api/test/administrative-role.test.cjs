const test = require("node:test");
const assert = require("node:assert/strict");
const {
  UserRole,
  Permission,
  canAccessPortal,
  getDefaultPortalPath,
  hasPermission
} = require("@homeschool/shared");

test("administrative teacher account enters the teacher portal without admin privileges", () => {
  const roles = [UserRole.TEACHER, UserRole.ADMINISTRATIVE];
  assert.equal(getDefaultPortalPath(roles), "/teacher/dashboard");
  assert.equal(canAccessPortal(roles, UserRole.TEACHER), true);
  assert.equal(hasPermission(roles, Permission.VIEW_GCR_COMPLIANCE), true);
  assert.equal(hasPermission(roles, Permission.MANAGE_USERS), false);
});

test("administrative role can review escalations and GCR audit", () => {
  const roles = [UserRole.ADMINISTRATIVE];
  assert.equal(hasPermission(roles, Permission.VIEW_ESCALATED_CONVERSATIONS), true);
  assert.equal(hasPermission(roles, Permission.JOIN_ESCALATED_CONVERSATIONS), true);
  assert.equal(hasPermission(roles, Permission.VIEW_GCR_AUDIT), true);
});

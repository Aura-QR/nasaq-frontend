export const ROLES = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  OWNER: "OWNER",
  SUPERVISOR: "SUPERVISOR",
  MANAGER: "MANAGER",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
});

export const PLATFORM_ROLES = Object.freeze([
  ROLES.SUPER_ADMIN,
]);

export const SCHOOL_ADMIN_ROLES = Object.freeze([
  ROLES.OWNER,
  ROLES.SUPERVISOR,
  ROLES.MANAGER,
]);

// Duty administration is also available to platform super admins.
// Keep this separate so SUPER_ADMIN does not gain unrelated school screens.
export const DUTY_ADMIN_ROLES = Object.freeze([
  ...SCHOOL_ADMIN_ROLES,
  ROLES.SUPER_ADMIN,
]);

export const SCHOOL_ROLES = Object.freeze([
  ...SCHOOL_ADMIN_ROLES,
  ROLES.TEACHER,
  ROLES.STUDENT,
]);

export const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

export const isPlatformRole = (role) =>
  PLATFORM_ROLES.includes(
    normalizeRole(role)
  );

export const isSchoolRole = (role) =>
  SCHOOL_ROLES.includes(
    normalizeRole(role)
  );

export const isSchoolAdminRole = (role) =>
  SCHOOL_ADMIN_ROLES.includes(
    normalizeRole(role)
  );

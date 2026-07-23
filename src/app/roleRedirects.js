import {
  ROUTES,
} from "./routePaths";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

const ROLE_HOME_PATHS = {
  [ROLES.SUPER_ADMIN]:
    ROUTES.PLATFORM_DASHBOARD,

  [ROLES.OWNER]:
    ROUTES.SCHOOL_DASHBOARD,

  [ROLES.SUPERVISOR]:
    ROUTES.SCHOOL_DASHBOARD,

  [ROLES.MANAGER]:
    ROUTES.SCHOOL_DASHBOARD,

  [ROLES.TEACHER]:
    ROUTES.TEACHER_DASHBOARD,

  [ROLES.STUDENT]:
    ROUTES.STUDENT_DASHBOARD,
};

export const getRoleHomePath = (
  role
) =>
  ROLE_HOME_PATHS[
    normalizeRole(role)
  ] ||
  ROUTES.NO_ACCESS;

export {
  ROLE_HOME_PATHS,
};

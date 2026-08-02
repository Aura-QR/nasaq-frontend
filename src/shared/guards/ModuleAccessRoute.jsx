import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuthUser,
} from "react-auth-kit";

import {
  getStoredPermissions,
} from "@/shared/auth/permissions";

const SCHOOL_ADMIN_ROLES = [
  "OWNER",
  "SUPERVISOR",
  "MANAGER",
];

const ROLE_BLOCKED_MODULES = {
  SUPERVISOR: [
    "managers",
  ],

  MANAGER: [
    "managers",
    "financial",
    "expenses",
  ],
};

const normalizeRole = (
  role
) =>
  String(role || "")
    .trim()
    .toUpperCase();

const normalizeOperation = (
  pathname
) => {
  const path =
    String(pathname || "")
      .toLowerCase();

  if (
    /\/(add|create|new)(\/|$)/.test(
      path
    )
  ) {
    return "create";
  }

  if (
    /\/(edit|update)(\/|$)/.test(
      path
    )
  ) {
    return "update";
  }

  return "read";
};

const hasArrayPermission = ({
  permissions,
  module,
  operation,
}) => {
  const requested =
    `school.${module}.${operation}`;

  const manage =
    `school.${module}.manage`;

  return (
    permissions.includes("*") ||
    permissions.includes(
      "school.*"
    ) ||
    permissions.includes(
      requested
    ) ||
    permissions.includes(
      manage
    )
  );
};

const hasObjectPermission = ({
  permissions,
  module,
  operation,
}) => {
  const modulePermissions =
    permissions?.[module] ||
    permissions?.school?.[
      module
    ] ||
    {};

  if (
    modulePermissions === true
  ) {
    return true;
  }

  return Boolean(
    modulePermissions?.manage ||
    modulePermissions?.[
      operation
    ] ||
    (
      operation === "create" &&
      modulePermissions?.add
    ) ||
    (
      operation === "update" &&
      modulePermissions?.edit
    )
  );
};

const hasModulePermission = ({
  permissions,
  module,
  operation,
}) => {
  if (
    permissions === "*"
  ) {
    return true;
  }

  if (
    Array.isArray(permissions)
  ) {
    return hasArrayPermission({
      permissions,
      module,
      operation,
    });
  }

  if (
    permissions &&
    typeof permissions ===
      "object"
  ) {
    return hasObjectPermission({
      permissions,
      module,
      operation,
    });
  }

  return false;
};

const ModuleAccessRoute = ({
  module,
  redirectTo = "/no-access",
}) => {
  const getAuthUser =
    useAuthUser();

  const location =
    useLocation();

  const authState =
    getAuthUser?.() || {};

  const user =
    authState?.user ||
    authState;

  const role =
    normalizeRole(
      user?.role ||
      authState?.role ||
      localStorage.getItem(
        "role"
      )
    );

  if (
    !SCHOOL_ADMIN_ROLES.includes(
      role
    )
  ) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  const blockedModules =
    ROLE_BLOCKED_MODULES[
      role
    ] || [];

  if (
    blockedModules.includes(
      module
    )
  ) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  /*
   * OWNER has every school permission.
   * SUPERVISOR has every operational
   * permission except manager management.
   */
  if (
    role === "OWNER" ||
    role === "SUPERVISOR"
  ) {
    return <Outlet />;
  }

  const permissions =
    authState?.permissions ||
    authState?.user
      ?.permissions ||
    getStoredPermissions();

  const operation =
    normalizeOperation(
      location.pathname
    );

  const allowed =
    hasModulePermission({
      permissions,
      module,
      operation,
    });

  if (!allowed) {
    return (
      <Navigate
        to={redirectTo}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ModuleAccessRoute;

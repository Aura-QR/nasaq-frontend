import {
  Navigate,
  useLocation,
} from "react-router-dom";

import usePermissions from "@/utils/hooks/usePermissions";

const OPERATION_MAP = {
  read: "read",
  add: "create",
  create: "create",
  edit: "update",
  update: "update",
  delete: "delete",
  manage: "manage",
};

const getStoredPermissions = () => {
  try {
    const raw =
      localStorage.getItem(
        "permissions"
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (
      typeof parsed ===
        "string" &&
      parsed.trim()
    ) {
      return [parsed.trim()];
    }

    return [];
  } catch {
    return [];
  }
};

const hasStoredPermission = (
  module,
  operation
) => {
  if (
    !module ||
    !operation
  ) {
    return false;
  }

  const permissions =
    getStoredPermissions();

  if (
    permissions.includes("*") ||
    permissions.includes(
      "school.*"
    )
  ) {
    return true;
  }

  const normalizedOperation =
    OPERATION_MAP[
      operation
    ] || operation;

  const expectedPermission =
    `school.${module}.${normalizedOperation}`;

  return permissions.includes(
    expectedPermission
  );
};

const RequirePermission = ({
  module,
  operation,
  children,
}) => {
  const location =
    useLocation();

  const allowedByHook =
    usePermissions(
      module,
      operation
    );

  /*
   * Important fallback:
   *
   * Login saves the effective flat permissions array in localStorage.
   * If react-auth-kit/authState is temporarily stale or shaped differently,
   * do not redirect a correctly-authorized user to /no-access.
   *
   * This fallback does NOT grant arbitrary access:
   * it checks the exact permission key only.
   *
   * Examples:
   * financial + read
   *   -> school.financial.read
   *
   * financialSettings + add
   *   -> school.financialSettings.create
   */
  const allowedByStoredPermissions =
    hasStoredPermission(
      module,
      operation
    );

  const allowed =
    Boolean(
      allowedByHook ||
        allowedByStoredPermissions
    );

  if (!allowed) {
    const normalizedOperation =
      OPERATION_MAP[
        operation
      ] || operation;

    const expectedPermission =
      module && operation
        ? `school.${module}.${normalizedOperation}`
        : null;

    if (
      import.meta.env.DEV
    ) {
      console.warn(
        "[RequirePermission] Access denied",
        {
          path:
            location.pathname,
          module,
          operation,
          expectedPermission,
          allowedByHook,
          allowedByStoredPermissions,
          storedPermissions:
            getStoredPermissions(),
        }
      );
    }

    return (
      <Navigate
        to="/no-access"
        replace
        state={{
          from:
            location.pathname,
          module,
          operation,
          expectedPermission,
        }}
      />
    );
  }

  return children;
};

export default RequirePermission;

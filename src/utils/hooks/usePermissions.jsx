const OPERATION_MAP = {
  read: "read",
  view: "read",

  add: "create",
  create: "create",

  edit: "update",
  update: "update",

  delete: "delete",
  remove: "delete",

  manage: "manage",
};

const EMPTY_MODULE_PERMISSIONS = {
  read: false,
  add: false,
  edit: false,
  delete: false,
};

const FULL_SCHOOL_ACCESS_ROLES = [
  "OWNER",
  "SUPERVISOR",

  /*
   * دعم مؤقت للحسابات القديمة
   * قبل تحويل ADMIN إلى OWNER.
   */
  "ADMIN",
];

const safeJsonParse = (
  value,
  fallback
) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getStoredRole = () => {
  const storedRole =
    localStorage.getItem("role");

  if (storedRole) {
    return String(storedRole)
      .trim()
      .toUpperCase();
  }

  const storedUser =
    safeJsonParse(
      localStorage.getItem("user"),
      null
    );

  return String(
    storedUser?.role || ""
  )
    .trim()
    .toUpperCase();
};

const getStoredPermissions = () => {
  const raw =
    localStorage.getItem(
      "permissions"
    );

  if (!raw) {
    return [];
  }

  const parsed =
    safeJsonParse(raw, []);

  return parsed || [];
};

const hasWildcardAccess = (
  permissions,
  role
) => {
  if (
    FULL_SCHOOL_ACCESS_ROLES.includes(
      role
    )
  ) {
    return true;
  }

  return (
    permissions === "*" ||
    permissions?.includes?.("*") ||
    permissions?.includes?.(
      "school.*"
    )
  );
};

const createFullModuleAccess =
  () => ({
    read: true,
    add: true,
    edit: true,
    delete: true,
  });

const createEmptyModuleAccess =
  () => ({
    ...EMPTY_MODULE_PERMISSIONS,
  });

const normalizeOperation = (
  operation
) =>
  OPERATION_MAP[operation] ||
  operation;

const buildPermissionName = (
  module,
  operation
) => {
  if (
    module?.startsWith?.("school.")
  ) {
    if (
      module.split(".").length >=
      3
    ) {
      return module;
    }

    return `${module}.${operation}`;
  }

  return `school.${module}.${operation}`;
};

/**
 * الاستخدام الحالي:
 *
 * usePermissions("students", "read")
 * usePermissions("students")
 *
 * ويدعم أيضًا:
 *
 * usePermissions("school.students.read")
 */
const usePermissions = (
  module,
  operation
) => {
  const role = getStoredRole();

  const permissions =
    getStoredPermissions();

  if (
    hasWildcardAccess(
      permissions,
      role
    )
  ) {
    return operation ||
      module?.split?.(".").length >=
        3
      ? true
      : createFullModuleAccess();
  }

  if (!permissions) {
    return operation
      ? false
      : createEmptyModuleAccess();
  }

  /*
   * الصيغة الجديدة:
   * ["school.students.read", ...]
   */
  if (
    Array.isArray(permissions)
  ) {
    if (!module) {
      return permissions;
    }

    const isFullPermissionString =
      module.startsWith?.(
        "school."
      ) &&
      module.split(".").length >=
        3;

    if (
      isFullPermissionString &&
      !operation
    ) {
      return permissions.includes(
        module
      );
    }

    const hasOperation = (
      requestedOperation
    ) => {
      const normalizedOperation =
        normalizeOperation(
          requestedOperation
        );

      const requestedPermission =
        buildPermissionName(
          module,
          normalizedOperation
        );

      const managePermission =
        buildPermissionName(
          module,
          "manage"
        );

      return (
        permissions.includes(
          requestedPermission
        ) ||
        permissions.includes(
          managePermission
        )
      );
    };

    if (operation) {
      return hasOperation(
        operation
      );
    }

    return {
      read:
        hasOperation("read"),
      add:
        hasOperation("add"),
      edit:
        hasOperation("edit"),
      delete:
        hasOperation("delete"),
    };
  }

  /*
   * دعم الصيغة القديمة:
   * {
   *   students: {
   *     read: true,
   *     add: true,
   *     edit: true,
   *     delete: true
   *   }
   * }
   */
  if (
    typeof permissions ===
      "object" &&
    module
  ) {
    const normalizedModule =
      module
        .replace(/^school\./, "")
        .split(".")[0];

    const modulePermissions =
      permissions[
        normalizedModule
      ] || {};

    if (operation) {
      return Boolean(
        modulePermissions[
          operation
        ] ??
          modulePermissions[
            normalizeOperation(
              operation
            )
          ]
      );
    }

    return {
      read: Boolean(
        modulePermissions.read
      ),

      add: Boolean(
        modulePermissions.add ??
          modulePermissions.create
      ),

      edit: Boolean(
        modulePermissions.edit ??
          modulePermissions.update
      ),

      delete: Boolean(
        modulePermissions.delete
      ),

      ...modulePermissions,
    };
  }

  if (!module) {
    return permissions;
  }

  return operation
    ? false
    : createEmptyModuleAccess();
};

export default usePermissions;

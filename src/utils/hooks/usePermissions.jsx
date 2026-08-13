const OPERATION_MAP = {
  read: "read",
  add: "create",
  create: "create",
  edit: "update",
  update: "update",
  delete: "delete",
  manage: "manage",
};

const EMPTY_MODULE_PERMISSIONS = {
  read: false,
  add: false,
  edit: false,
  delete: false,
};

/*
 * Business Rule:
 *
 * OWNER / SUPERVISOR / MANAGER
 * يشاهدون فقط:
 * - التحضير
 * - الامتحانات / الواجبات / الأنشطة / الكويز
 * - توزيع الدرجات
 * - المشاريع
 *
 * ولا يحق لهم:
 * Create / Update / Delete
 */
const ADMIN_READ_ONLY_ROLES = new Set([
  "OWNER",
  "SUPERVISOR",
  "MANAGER",
]);

const ACADEMIC_READ_ONLY_MODULES = new Set([
  "exams",
  "projects",
  "gradesCriteria",
  "preparation",
]);

const normalizeRole = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const getCurrentRole = () => {
  try {
    const storedRole = localStorage.getItem("role");

    if (storedRole) {
      return normalizeRole(storedRole);
    }

    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      const user = JSON.parse(storedUser);

      return normalizeRole(
        user?.role ||
          user?.user?.role
      );
    }
  } catch (error) {
    console.warn(
      "Unable to read current user role:",
      error
    );
  }

  return "";
};

const getReadOnlyPermissions = (
  operation
) => {
  if (operation) {
    const normalizedOperation =
      OPERATION_MAP[operation] ||
      operation;

    return (
      normalizedOperation === "read"
    );
  }

  return {
    read: true,
    add: false,
    edit: false,
    delete: false,
  };
};

/**
 * Supports both permission formats:
 *
 * Old:
 * {
 *   students: {
 *     read: true,
 *     add: true,
 *     edit: true,
 *     delete: true
 *   }
 * }
 *
 * New:
 * [
 *   "school.students.read",
 *   "school.students.create",
 *   "school.students.update",
 *   "school.students.delete"
 * ]
 */
const usePermissions = (
  module,
  operation
) => {
  const role = getCurrentRole();

  /*
   * IMPORTANT:
   * هذا الشرط يسبق wildcard "*".
   *
   * حتى لو OWNER أو SUPERVISOR عنده "*"
   * لن يحصل على صلاحيات تعديل في
   * الأكاديميات المحددة أعلاه.
   */
  if (
    ADMIN_READ_ONLY_ROLES.has(role) &&
    ACADEMIC_READ_ONLY_MODULES.has(
      module
    )
  ) {
    return getReadOnlyPermissions(
      operation
    );
  }

  const raw =
    localStorage.getItem(
      "permissions"
    );

  if (!raw) {
    return operation
      ? false
      : {
          ...EMPTY_MODULE_PERMISSIONS,
        };
  }

  let permissions;

  try {
    permissions = JSON.parse(raw);
  } catch {
    return operation
      ? false
      : {
          ...EMPTY_MODULE_PERMISSIONS,
        };
  }

  if (!permissions) {
    return operation
      ? false
      : {
          ...EMPTY_MODULE_PERMISSIONS,
        };
  }

  // Full-access shortcut
  if (
    permissions === "*" ||
    permissions?.includes?.("*") ||
    permissions?.includes?.(
      "school.*"
    )
  ) {
    if (operation) {
      return true;
    }

    return {
      read: true,
      add: true,
      edit: true,
      delete: true,
    };
  }

  // New permissions array format
  if (Array.isArray(permissions)) {
    if (!module) {
      return permissions;
    }

    const prefix =
      `school.${module}.`;

    const hasManage =
      permissions.includes(
        `${prefix}manage`
      );

    const hasOperation = (
      requestedOperation
    ) => {
      const normalizedOperation =
        OPERATION_MAP[
          requestedOperation
        ] ||
        requestedOperation;

      return (
        hasManage ||
        permissions.includes(
          `${prefix}${normalizedOperation}`
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

  // Old nested-object format
  if (
    typeof permissions ===
      "object" &&
    module &&
    module in permissions
  ) {
    const modulePermissions =
      permissions[module] || {};

    if (operation) {
      return Boolean(
        modulePermissions[
          operation
        ]
      );
    }

    return {
      read: Boolean(
        modulePermissions.read
      ),

      add: Boolean(
        modulePermissions.add
      ),

      edit: Boolean(
        modulePermissions.edit
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
    : {
        ...EMPTY_MODULE_PERMISSIONS,
      };
};

export default usePermissions;
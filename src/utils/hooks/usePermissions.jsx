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
    localStorage.getItem(
      "role"
    );

  if (storedRole) {
    return String(storedRole)
      .trim()
      .toUpperCase();
  }

  const storedUser =
    safeJsonParse(
      localStorage.getItem(
        "user"
      ),
      null
    );

  return String(
    storedUser?.role || ""
  )
    .trim()
    .toUpperCase();
};

const getStoredPermissions =
  () => {
    const raw =
      localStorage.getItem(
        "permissions"
      );

    if (!raw) {
      return [];
    }

    const parsed =
      safeJsonParse(
        raw,
        []
      );

    return parsed || [];
  };

const getModuleKey = (
  module
) => {
  const normalized =
    String(module || "")
      .replace(/^school\./, "");

  return normalized.split(".")[0];
};

const isRoleBlocked = (
  role,
  module
) => {
  const moduleKey =
    getModuleKey(module);

  return (
    ROLE_BLOCKED_MODULES[
      role
    ] || []
  ).includes(moduleKey);
};

const hasWildcardAccess = (
  permissions,
  role,
  module
) => {
  if (
    isRoleBlocked(
      role,
      module
    )
  ) {
    return false;
  }

  if (
    FULL_SCHOOL_ACCESS_ROLES.includes(
      role
    )
  ) {
    return true;
  }

  return (
    permissions === "*" ||
    permissions?.includes?.(
      "*"
    ) ||
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
    module?.startsWith?.(
      "school."
    )
  ) {
    if (
      module.split(".")
        .length >= 3
    ) {
      return module;
    }

    return `${module}.${operation}`;
  }

  return `school.${module}.${operation}`;
};

const usePermissions = (
  module,
  operation
) => {
  const role =
    getStoredRole();

  const permissions =
    getStoredPermissions();

  if (
    isRoleBlocked(
      role,
      module
    )
  ) {
    return operation ||
      module?.split?.(".")
        .length >= 3
      ? false
      : createEmptyModuleAccess();
  }

  if (
    hasWildcardAccess(
      permissions,
      role,
      module
    )
  ) {
    return operation ||
      module?.split?.(".")
        .length >= 3
      ? true
      : createFullModuleAccess();
  }

  if (!permissions) {
    return operation
      ? false
      : createEmptyModuleAccess();
  }

  if (
    Array.isArray(
      permissions
    )
  ) {
    if (!module) {
      return permissions;
    }

    const isFullPermissionString =
      module.startsWith?.(
        "school."
      ) &&
      module.split(".")
        .length >= 3;

    if (
      isFullPermissionString &&
      !operation
    ) {
      return (
        permissions.includes(
          module
        ) ||
        permissions.includes(
          `${module
            .split(".")
            .slice(0, 2)
            .join(".")}.manage`
        )
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
        hasOperation(
          "read"
        ),

      add:
        hasOperation(
          "add"
        ),

      edit:
        hasOperation(
          "edit"
        ),

      delete:
        hasOperation(
          "delete"
        ),
    };
  }

  if (
    typeof permissions ===
      "object" &&
    module
  ) {
    const normalizedModule =
      getModuleKey(module);

    const modulePermissions =
      permissions[
        normalizedModule
      ] ||
      permissions?.school?.[
        normalizedModule
      ] ||
      {};

    if (
      modulePermissions ===
      true
    ) {
      return operation
        ? true
        : createFullModuleAccess();
    }

    if (operation) {
      const normalizedOperation =
        normalizeOperation(
          operation
        );

      const operationValue =
        modulePermissions[
          operation
        ] ??
        modulePermissions[
          normalizedOperation
        ];

      return Boolean(
        modulePermissions.manage ||
        operationValue
      );
    }

    return {
      read: Boolean(
        modulePermissions.manage ||
        modulePermissions.read
      ),

      add: Boolean(
        modulePermissions.manage ||
        modulePermissions.add ||
        modulePermissions.create
      ),

      edit: Boolean(
        modulePermissions.manage ||
        modulePermissions.edit ||
        modulePermissions.update
      ),

      delete: Boolean(
        modulePermissions.manage ||
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

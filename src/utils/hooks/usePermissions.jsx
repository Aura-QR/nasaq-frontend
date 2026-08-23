import {
  useAuthUser,
} from "react-auth-kit";

const OPERATION_MAP = {
  read: "read",

  add: "create",
  create: "create",

  edit: "update",
  update: "update",

  delete: "delete",

  manage: "manage",
};

const LEGACY_OPERATION_MAP = {
  read: "read",
  create: "add",
  update: "edit",
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
 * OWNER / SUPERVISOR
 *
 * الباك يعطيهم ["*"] عند تسجيل الدخول.
 */
const FULL_ACCESS_ROLES = new Set([
  "OWNER",
  "SUPERVISOR",
]);

/*
 * SUPER_ADMIN خاص بالمنصة
 * ولا يدخل school-scoped routes.
 */
const PLATFORM_ONLY_ROLES = new Set([
  "SUPER_ADMIN",
]);

/*
 * محتوى خاص بالمعلم.
 *
 * OWNER / SUPERVISOR / MANAGER:
 * Read  ✅
 * Add   ❌
 * Edit  ❌
 * Delete ✅
 *
 * المعلم هو الذي ينشئ ويعدل
 * المحتوى التعليمي الخاص به.
 */
const TEACHER_AUTHORED_MODULES =
  new Set([
    "exams",
    "projects",
    "preparation",
  ]);

const NON_TEACHER_ADMIN_ROLES =
  new Set([
    "OWNER",
    "SUPERVISOR",
    "MANAGER",
  ]);

const normalizeRole = (
  value
) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeOperation = (
  operation
) =>
  OPERATION_MAP[
    operation
  ] || operation;

/*
 * استخرج المستخدم الحالي
 * من react-auth-kit.
 */
const getAuthenticatedUser = (
  authState
) => {
  const candidates = [
    authState?.user,
    authState?.admin,

    authState?.data?.user,
    authState?.data?.admin,

    authState?.data?.data?.user,
    authState?.data?.data?.admin,

    authState,
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(
          candidate
        ) &&
        (
          candidate.role ||
          candidate.email ||
          candidate._id ||
          candidate.id
        )
    ) || {}
  );
};

const getLocalStorageUser =
  () => {
    try {
      const raw =
        localStorage.getItem(
          "user"
        );

      if (!raw) {
        return {};
      }

      return (
        JSON.parse(raw) ||
        {}
      );
    } catch {
      return {};
    }
  };

const getLocalStoragePermissions =
  () => {
    const raw =
      localStorage.getItem(
        "permissions"
      );

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(
        raw
      );
    } catch {
      if (
        raw === "*" ||
        raw === "school.*"
      ) {
        return [raw];
      }

      return null;
    }
  };

const normalizePermissionsValue =
  (value) => {
    if (
      Array.isArray(value)
    ) {
      return value;
    }

    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return [
        value.trim(),
      ];
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      return value;
    }

    return null;
  };

const getFullPermissions =
  () => ({
    read: true,
    add: true,
    edit: true,
    delete: true,
  });

const hasFullAccess = (
  permissions
) => {
  if (
    permissions === "*" ||
    permissions ===
      "school.*"
  ) {
    return true;
  }

  if (
    Array.isArray(
      permissions
    )
  ) {
    return (
      permissions.includes(
        "*"
      ) ||
      permissions.includes(
        "school.*"
      )
    );
  }

  return false;
};

/*
 * Exams / Projects / Preparation
 *
 * ليست محتوى إداري.
 *
 * OWNER / SUPERVISOR / MANAGER
 * لا ننفذ لهم Create أو Update
 * من الواجهة.
 */
const isTeacherAuthoredOperationBlocked =
  (
    role,
    module,
    operation
  ) => {
    if (
      !NON_TEACHER_ADMIN_ROLES.has(
        role
      )
    ) {
      return false;
    }

    if (
      !TEACHER_AUTHORED_MODULES.has(
        module
      )
    ) {
      return false;
    }

    const normalizedOperation =
      normalizeOperation(
        operation
      );

    return [
      "create",
      "update",
    ].includes(
      normalizedOperation
    );
  };

/*
 * New flat permission format:
 *
 * [
 *   "school.students.read",
 *   "school.students.create",
 *   "school.students.update",
 *   "school.students.delete"
 * ]
 */
const createArrayChecker = (
  permissions,
  module
) => {
  const prefix =
    `school.${module}.`;

  const hasManage =
    permissions.includes(
      `${prefix}manage`
    );

  return (
    requestedOperation
  ) => {
    const operation =
      normalizeOperation(
        requestedOperation
      );

    return (
      hasManage ||
      permissions.includes(
        `${prefix}${operation}`
      )
    );
  };
};

/*
 * Old permission format:
 *
 * {
 *   students: {
 *     read: true,
 *     add: true,
 *     edit: true,
 *     delete: true
 *   }
 * }
 */
const createLegacyChecker = (
  modulePermissions
) => {
  return (
    requestedOperation
  ) => {
    const normalizedOperation =
      normalizeOperation(
        requestedOperation
      );

    const legacyOperation =
      LEGACY_OPERATION_MAP[
        normalizedOperation
      ] ||
      requestedOperation;

    return Boolean(
      modulePermissions[
        legacyOperation
      ] ??
        modulePermissions[
          normalizedOperation
        ]
    );
  };
};

const usePermissions = (
  module,
  operation
) => {
  const getAuthUser =
    useAuthUser();

  const authState =
    getAuthUser?.() ||
    {};

  const authUser =
    getAuthenticatedUser(
      authState
    );

  const storedUser =
    getLocalStorageUser();

  /*
   * Session الحالية هي المصدر الأساسي.
   */
  const role =
    normalizeRole(
      authUser?.role ||
        authState?.role ||
        storedUser?.role ||
        storedUser?.user
          ?.role ||
        localStorage.getItem(
          "role"
        )
    );

  /*
   * مهم:
   *
   * MANAGER لم يعد له
   * managerPermissions خاصة بالحساب.
   *
   * الـ Backend يضع MANAGER permissions
   * الموحدة للمدرسة داخل الـ token
   * عند تسجيل الدخول.
   *
   * كذلك promoted teacher يأخذ
   * الصلاحيات المدمجة في token.
   *
   * لذلك لا نقرأ managerPermissions هنا.
   */
  const authPermissions =
    normalizePermissionsValue(
      authState
        ?.permissions ??
        authUser
          ?.permissions
    );

  let permissions =
    authPermissions;

  /*
   * LocalStorage مجرد fallback.
   */
  if (
    permissions === null
  ) {
    permissions =
      getLocalStoragePermissions();
  }

  /*
   * SUPER_ADMIN
   */
  if (
    PLATFORM_ONLY_ROLES.has(
      role
    )
  ) {
    return operation
      ? false
      : {
          ...EMPTY_MODULE_PERMISSIONS,
        };
  }

  /*
   * OWNER / SUPERVISOR
   *
   * Full Access بشكل عام.
   */
  if (
    FULL_ACCESS_ROLES.has(
      role
    )
  ) {
    if (operation) {
      if (
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          operation
        )
      ) {
        return false;
      }

      return true;
    }

    const result =
      getFullPermissions();

    if (
      TEACHER_AUTHORED_MODULES.has(
        module
      )
    ) {
      result.add =
        false;

      result.edit =
        false;
    }

    return result;
  }

  /*
   * لو مفيش permissions.
   */
  if (!permissions) {
    return operation
      ? false
      : {
          ...EMPTY_MODULE_PERMISSIONS,
        };
  }

  /*
   * Wildcard.
   */
  if (
    hasFullAccess(
      permissions
    )
  ) {
    if (operation) {
      if (
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          operation
        )
      ) {
        return false;
      }

      return true;
    }

    const result =
      getFullPermissions();

    if (
      TEACHER_AUTHORED_MODULES.has(
        module
      ) &&
      NON_TEACHER_ADMIN_ROLES.has(
        role
      )
    ) {
      result.add =
        false;

      result.edit =
        false;
    }

    return result;
  }

  /*
   * New permissions array.
   *
   * MANAGER الحالي يدخل هنا
   * ويقرأ School MANAGER Set
   * الموجود في الـ JWT.
   */
  if (
    Array.isArray(
      permissions
    )
  ) {
    if (!module) {
      return permissions;
    }

    const hasOperation =
      createArrayChecker(
        permissions,
        module
      );

    if (operation) {
      if (
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          operation
        )
      ) {
        return false;
      }

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
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          "add"
        )
          ? false
          : hasOperation(
              "add"
            ),

      edit:
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          "edit"
        )
          ? false
          : hasOperation(
              "edit"
            ),

      delete:
        hasOperation(
          "delete"
        ),
    };
  }

  /*
   * Legacy nested-object format.
   */
  if (
    typeof permissions ===
      "object" &&
    permissions !== null &&
    module &&
    module in permissions
  ) {
    const modulePermissions =
      permissions[module] ||
      {};

    const hasOperation =
      createLegacyChecker(
        modulePermissions
      );

    if (operation) {
      if (
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          operation
        )
      ) {
        return false;
      }

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
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          "add"
        )
          ? false
          : hasOperation(
              "add"
            ),

      edit:
        isTeacherAuthoredOperationBlocked(
          role,
          module,
          "edit"
        )
          ? false
          : hasOperation(
              "edit"
            ),

      delete:
        hasOperation(
          "delete"
        ),
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
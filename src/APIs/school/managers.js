import {
  api,
} from "../Axios";

import {
  getApiError,
} from "../helpers/getApiError";

const MANAGERS_ENDPOINT =
  "/managers";

const MANAGERS_CACHE_TTL =
  15_000;

let managersCache = null;
let managersCacheTime = 0;
let managersPendingRequest = null;

/*
 * Default permissions used only when creating/updating a MANAGER
 * without an explicit permissions array.
 *
 * Per-manager permissions are stored and updated through:
 * PATCH /managers/:id/permissions
 */
export const MANAGER_DEFAULT_PERMISSIONS = [
  "school.students.read",
  "school.students.create",
  "school.students.update",
  "school.students.delete",

  "school.teachers.manage",
  "school.subjects.manage",
  "school.classes.manage",
  "school.lectures.manage",

  "school.gradesCriteria.manage",
  "school.exams.manage",
  "school.projects.manage",

  "school.attendance.manage",
  "school.preparation.manage",
  "school.library.manage",
];

const normalizeText = (
  value
) =>
  String(value || "")
    .trim();

const normalizeEmail = (
  value
) =>
  normalizeText(value)
    .toLowerCase();

const normalizeRole = (
  value
) => {
  const role =
    normalizeText(value)
      .toUpperCase();

  return role ===
    "SUPERVISOR"
    ? "SUPERVISOR"
    : "MANAGER";
};

const normalizeManagerType = (
  value
) => {
  const type =
    normalizeText(value)
      .toLowerCase();

  return type === "admin" ||
    type === "teacher"
    ? type
    : "";
};

const normalizePermissions = (
  permissions
) =>
  Array.from(
    new Set(
      (
        Array.isArray(
          permissions
        )
          ? permissions
          : []
      )
        .map(normalizeText)
        .filter(
          (permission) =>
            permission === "*" ||
            permission.startsWith(
              "school."
            )
        )
    )
  );

const invalidateManagersCache =
  () => {
    managersCache = null;
    managersCacheTime = 0;
  };

const normalizeCreatePayload = (
  payload
) => {
  const role =
    normalizeRole(
      payload?.role
    );

  const requestedPermissions =
    normalizePermissions(
      payload?.permissions
    );

  const permissions =
    role === "SUPERVISOR"
      ? ["*"]
      : requestedPermissions.length
      ? requestedPermissions
      : MANAGER_DEFAULT_PERMISSIONS;

  return {
    username:
      normalizeText(
        payload?.username
      ),

    email:
      normalizeEmail(
        payload?.email
      ),

    password:
      payload?.password ||
      "",

    role,

    permissions,
  };
};

export const fetchManagers =
  async ({
    force = false,
  } = {}) => {
    const now = Date.now();

    if (
      !force &&
      managersCache &&
      now - managersCacheTime <
        MANAGERS_CACHE_TTL
    ) {
      return managersCache;
    }

    if (
      !force &&
      managersPendingRequest
    ) {
      return managersPendingRequest;
    }

    managersPendingRequest =
      api
        .get(
          MANAGERS_ENDPOINT
        )
        .then((response) => {
          managersCache =
            response.data;

          managersCacheTime =
            Date.now();

          return response.data;
        })
        .catch((error) =>
          getApiError(
            error,
            "تعذر تحميل المديرين والمساعدين"
          )
        )
        .finally(() => {
          managersPendingRequest =
            null;
        });

    return managersPendingRequest;
  };

export const createManager =
  async (payload) => {
    try {
      const response =
        await api.post(
          MANAGERS_ENDPOINT,
          normalizeCreatePayload(
            payload
          )
        );

      invalidateManagersCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر إنشاء الحساب الإداري"
      );
    }
  };

/**
 * Update one manager's own permission array.
 *
 * Backend endpoint:
 * PATCH /managers/:id/permissions
 *
 * Body:
 * {
 *   permissions: string[]
 * }
 */
export const updateManagerPermissions =
  async (
    managerId,
    permissions = []
  ) => {
    const normalizedManagerId =
      normalizeText(
        managerId
      );

    if (!normalizedManagerId) {
      return {
        status: false,
        message:
          "معرّف المدير غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${MANAGERS_ENDPOINT}/${normalizedManagerId}/permissions`,
          {
            permissions:
              normalizePermissions(
                permissions
              ),
          }
        );

      invalidateManagersCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحديث صلاحيات المدير"
      );
    }
  };

/**
 * Promote an existing teacher to manager.
 * Backend endpoint:
 * PATCH /managers/promote/:teacherId
 * Request body: none.
 */
export const promoteTeacherToManager =
  async (teacherId) => {
    const normalizedTeacherId =
      normalizeText(
        teacherId
      );

    if (!normalizedTeacherId) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${MANAGERS_ENDPOINT}/promote/${normalizedTeacherId}`
        );

      invalidateManagersCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر ترقية المعلم إلى مدير"
      );
    }
  };

/**
 * Demote a teacher-manager to teacher.
 * Backend endpoint:
 * PATCH /managers/demote/:teacherId
 * Request body: none.
 */
export const demoteTeacherFromManager =
  async (teacherId) => {
    const normalizedTeacherId =
      normalizeText(
        teacherId
      );

    if (!normalizedTeacherId) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${MANAGERS_ENDPOINT}/demote/${normalizedTeacherId}`
        );

      invalidateManagersCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر إلغاء صلاحية المدير من المعلم"
      );
    }
  };

/**
 * Delete a manager account.
 *
 * Backend endpoint:
 * DELETE /managers/:id?type=admin|teacher
 */
export const deleteManager =
  async (
    managerId,
    type
  ) => {
    const normalizedManagerId =
      normalizeText(
        managerId
      );

    const normalizedType =
      normalizeManagerType(
        type
      );

    if (!normalizedManagerId) {
      return {
        status: false,
        message:
          "معرّف الحساب الإداري غير موجود",
      };
    }

    if (!normalizedType) {
      return {
        status: false,
        message:
          "نوع الحساب الإداري غير محدد",
      };
    }

    try {
      const response =
        await api.delete(
          `${MANAGERS_ENDPOINT}/${normalizedManagerId}`,
          {
            params: {
              type:
                normalizedType,
            },
          }
        );

      invalidateManagersCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف الحساب الإداري"
      );
    }
  };

/**
 * Set or auto-generate a password for an administrative account.
 *
 * Backend endpoint:
 * PATCH /managers/:id/password
 *
 * Body:
 * - {} to auto-generate a password
 * - { password } to set a specific password
 */
export const adminSetManagerPassword =
  async (managerId, payload = {}) => {
    const normalizedManagerId =
      normalizeText(managerId);

    if (!normalizedManagerId) {
      return {
        status: false,
        message:
          "معرّف الحساب الإداري غير موجود",
      };
    }

    try {
      const response = await api.patch(
        `${MANAGERS_ENDPOINT}/${normalizedManagerId}/password`,
        payload?.password
          ? { password: payload.password }
          : {}
      );

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تعيين كلمة المرور"
      );
    }
  };

/*
 * Backward-compatible aliases.
 */
export const getSchoolManagers =
  fetchManagers;

export const createSchoolManager =
  createManager;

export const deleteSchoolManager =
  deleteManager;

export const promoteManager =
  promoteTeacherToManager;

export const demoteManager =
  demoteTeacherFromManager;

export default {
  MANAGER_DEFAULT_PERMISSIONS,
  fetchManagers,
  getSchoolManagers,
  createManager,
  createSchoolManager,
  updateManagerPermissions,
  adminSetManagerPassword,
  promoteTeacherToManager,
  demoteTeacherFromManager,
  promoteManager,
  demoteManager,
  deleteManager,
  deleteSchoolManager,
};

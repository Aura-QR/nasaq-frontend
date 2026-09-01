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

const invalidateManagersCache =
  () => {
    managersCache = null;
    managersCacheTime = 0;
  };

const normalizeCreatePayload = (
  payload
) => ({
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

  role:
    normalizeRole(
      payload?.role
    ),
});

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

/*
 * Backward-compatible aliases.
 * They prevent older school pages from breaking
 * while the route-based List/Add pages are used.
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
  fetchManagers,
  getSchoolManagers,
  createManager,
  createSchoolManager,
  promoteTeacherToManager,
  demoteTeacherFromManager,
  promoteManager,
  demoteManager,
  deleteManager,
  deleteSchoolManager,
};

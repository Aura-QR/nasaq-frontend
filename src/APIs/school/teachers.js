import {
  api,
} from "../Axios";

import {
  getApiError,
} from "../helpers/getApiError";

const ENDPOINT =
  "/teachers";

const CACHE_TTL =
  15_000;

const listCache =
  new Map();

const listPending =
  new Map();

const teacherCache =
  new Map();

const teacherPending =
  new Map();

const normalizeText = (
  value
) =>
  String(value ?? "")
    .trim();

const normalizeId = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object"
  ) {
    return normalizeText(
      value._id ||
      value.id
    );
  }

  return normalizeText(
    value
  );
};

const normalizeError = (
  value,
  fallback
) => {
  if (
    typeof value ===
      "string"
  ) {
    return {
      status: false,
      message:
        value ||
        fallback,
    };
  }

  return {
    ...(value &&
    typeof value ===
      "object"
      ? value
      : {}),
    status: false,
    message:
      value?.message ||
      fallback,
  };
};

const normalizeSuccess = (
  response
) => {
  const envelope =
    response?.data;

  if (
    envelope?.status ===
      false
  ) {
    return {
      status: false,
      message:
        envelope?.message ||
        "فشلت العملية",
      data:
        envelope?.data,
    };
  }

  return {
    status: true,
    message:
      envelope?.message ||
      "Success",
    data:
      envelope?.data ??
      envelope,
  };
};

const clearTeachersCache =
  () => {
    listCache.clear();
    teacherCache.clear();
  };

const normalizeFilters = (
  filters = {}
) => {
  const normalized = {};

  const page =
    Number(filters.page);

  const limit =
    Number(filters.limit);

  normalized.page =
    Number.isFinite(page) &&
    page > 0
      ? page
      : 1;

  normalized.limit =
    Number.isFinite(limit) &&
    limit > 0
      ? limit
      : 10;

  [
    "name",
    "email",
    "specialization",
  ].forEach((key) => {
    const value =
      normalizeText(
        filters[key]
      );

    if (value) {
      normalized[key] =
        value;
    }
  });

  if (
    typeof filters.isActive ===
      "boolean"
  ) {
    normalized.isActive =
      filters.isActive;
  }

  return normalized;
};

const normalizeSubjectIds = (
  value
) =>
  Array.from(
    new Set(
      (
        Array.isArray(value)
          ? value
          : []
      )
        .map(normalizeId)
        .filter(Boolean)
    )
  );

const normalizeTeacherPayload = (
  payload = {},
  {
    partial = false,
  } = {}
) => {
  const source =
    payload &&
    typeof payload ===
      "object"
      ? payload
      : {};

  const result = {};

  const requiredTextFields = [
    "name",
    "email",
  ];

  const optionalTextFields = [
    "phoneNumber",
    "qualification",
    "specialization",
    "address",
    "status",
  ];

  requiredTextFields.forEach(
    (key) => {
      if (
        !partial ||
        Object.prototype.hasOwnProperty.call(
          source,
          key
        )
      ) {
        result[key] =
          normalizeText(
            source[key]
          );
      }
    }
  );

  optionalTextFields.forEach(
    (key) => {
      if (
        !Object.prototype.hasOwnProperty.call(
          source,
          key
        )
      ) {
        return;
      }

      const value =
        normalizeText(
          source[key]
        );

      if (value) {
        result[key] =
          key === "email"
            ? value.toLowerCase()
            : value;
      } else if (partial) {
        result[key] = "";
      }
    }
  );

  if (result.email) {
    result.email =
      result.email.toLowerCase();
  }

  if (
    Object.prototype.hasOwnProperty.call(
      source,
      "experience"
    )
  ) {
    const value =
      normalizeText(
        source.experience
      );

    if (
      value ||
      partial
    ) {
      result.experience =
        value;
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      source,
      "hireDate"
    )
  ) {
    const value =
      normalizeText(
        source.hireDate
      );

    if (value) {
      result.hireDate =
        value.includes("T")
          ? value.split("T")[0]
          : value;
    } else if (partial) {
      result.hireDate =
        "";
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(
      source,
      "isActive"
    )
  ) {
    result.isActive =
      source.isActive === true ||
      source.isActive === 1 ||
      source.isActive === "1" ||
      source.isActive ===
        "true";
  }

  if (
    Object.prototype.hasOwnProperty.call(
      source,
      "subjectIds"
    )
  ) {
    result.subjectIds =
      normalizeSubjectIds(
        source.subjectIds
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      source,
      "password"
    )
  ) {
    const password =
      String(
        source.password ?? ""
      );

    if (password) {
      result.password =
        password;
    }
  }

  return result;
};

const makeListKey = (
  filters
) =>
  JSON.stringify(
    normalizeFilters(filters)
  );

export const getSchoolTeachers =
  async (
    filters = {},
    {
      force = false,
    } = {}
  ) => {
    const normalizedFilters =
      normalizeFilters(
        filters
      );

    const cacheKey =
      JSON.stringify(
        normalizedFilters
      );

    const cached =
      listCache.get(
        cacheKey
      );

    if (
      !force &&
      cached &&
      Date.now() -
        cached.createdAt <
        CACHE_TTL
    ) {
      return cached.value;
    }

    if (
      !force &&
      listPending.has(
        cacheKey
      )
    ) {
      return listPending.get(
        cacheKey
      );
    }

    const request =
      api
        .get(
          ENDPOINT,
          {
            params:
              normalizedFilters,
          }
        )
        .then(
          normalizeSuccess
        )
        .then((result) => {
          if (result.status) {
            listCache.set(
              cacheKey,
              {
                value: result,
                createdAt:
                  Date.now(),
              }
            );
          }

          return result;
        })
        .catch((error) =>
          normalizeError(
            getApiError(
              error,
              "تعذر تحميل المعلمين"
            ),
            "تعذر تحميل المعلمين"
          )
        )
        .finally(() => {
          listPending.delete(
            cacheKey
          );
        });

    listPending.set(
      cacheKey,
      request
    );

    return request;
  };

export const getSchoolTeachersList =
  async ({
    force = false,
  } = {}) => {
    const cacheKey =
      "__teachers-list__";

    const cached =
      listCache.get(
        cacheKey
      );

    if (
      !force &&
      cached &&
      Date.now() -
        cached.createdAt <
        CACHE_TTL
    ) {
      return cached.value;
    }

    if (
      !force &&
      listPending.has(
        cacheKey
      )
    ) {
      return listPending.get(
        cacheKey
      );
    }

    const request =
      api
        .get(
          `${ENDPOINT}/list`
        )
        .then(
          normalizeSuccess
        )
        .then((result) => {
          if (result.status) {
            listCache.set(
              cacheKey,
              {
                value: result,
                createdAt:
                  Date.now(),
              }
            );
          }

          return result;
        })
        .catch((error) =>
          normalizeError(
            getApiError(
              error,
              "تعذر تحميل قائمة المعلمين"
            ),
            "تعذر تحميل قائمة المعلمين"
          )
        )
        .finally(() => {
          listPending.delete(
            cacheKey
          );
        });

    listPending.set(
      cacheKey,
      request
    );

    return request;
  };

export const getCurrentTeacher =
  async () => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/me`
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر تحميل بيانات المعلم"
        ),
        "تعذر تحميل بيانات المعلم"
      );
    }
  };

export const getTeachersBySubject =
  async (
    subjectId
  ) => {
    const normalizedSubjectId =
      normalizeId(
        subjectId
      );

    if (
      !normalizedSubjectId
    ) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response =
        await api.get(
          `${ENDPOINT}/by-subject/${normalizedSubjectId}`
        );

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر تحميل معلمي المادة"
        ),
        "تعذر تحميل معلمي المادة"
      );
    }
  };

export const getSchoolTeacherById =
  async (
    teacherId,
    {
      force = false,
    } = {}
  ) => {
    const normalizedTeacherId =
      normalizeId(
        teacherId
      );

    if (
      !normalizedTeacherId
    ) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    const cached =
      teacherCache.get(
        normalizedTeacherId
      );

    if (
      !force &&
      cached &&
      Date.now() -
        cached.createdAt <
        CACHE_TTL
    ) {
      return cached.value;
    }

    if (
      !force &&
      teacherPending.has(
        normalizedTeacherId
      )
    ) {
      return teacherPending.get(
        normalizedTeacherId
      );
    }

    const request =
      api
        .get(
          `${ENDPOINT}/${normalizedTeacherId}`
        )
        .then(
          normalizeSuccess
        )
        .then((result) => {
          if (result.status) {
            teacherCache.set(
              normalizedTeacherId,
              {
                value: result,
                createdAt:
                  Date.now(),
              }
            );
          }

          return result;
        })
        .catch((error) =>
          normalizeError(
            getApiError(
              error,
              "تعذر تحميل بيانات المعلم"
            ),
            "تعذر تحميل بيانات المعلم"
          )
        )
        .finally(() => {
          teacherPending.delete(
            normalizedTeacherId
          );
        });

    teacherPending.set(
      normalizedTeacherId,
      request
    );

    return request;
  };

export const createSchoolTeacher =
  async (payload) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          normalizeTeacherPayload(
            payload
          )
        );

      clearTeachersCache();

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر إضافة المعلم"
        ),
        "تعذر إضافة المعلم"
      );
    }
  };

export const updateSchoolTeacher =
  async (
    teacherId,
    payload
  ) => {
    const normalizedTeacherId =
      normalizeId(
        teacherId
      );

    if (
      !normalizedTeacherId
    ) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${normalizedTeacherId}`,
          normalizeTeacherPayload(
            payload,
            {
              partial: true,
            }
          )
        );

      clearTeachersCache();

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر تعديل بيانات المعلم"
        ),
        "تعذر تعديل بيانات المعلم"
      );
    }
  };

export const toggleSchoolTeacherActive =
  async (teacherId) => {
    const normalizedTeacherId =
      normalizeId(
        teacherId
      );

    if (
      !normalizedTeacherId
    ) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${normalizedTeacherId}/toggle-active`
        );

      clearTeachersCache();

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر تغيير حالة المعلم"
        ),
        "تعذر تغيير حالة المعلم"
      );
    }
  };

export const deleteSchoolTeacher =
  async (teacherId) => {
    const normalizedTeacherId =
      normalizeId(
        teacherId
      );

    if (
      !normalizedTeacherId
    ) {
      return {
        status: false,
        message:
          "معرّف المعلم غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${normalizedTeacherId}`
        );

      clearTeachersCache();

      return normalizeSuccess(
        response
      );
    } catch (error) {
      return normalizeError(
        getApiError(
          error,
          "تعذر حذف المعلم"
        ),
        "تعذر حذف المعلم"
      );
    }
  };

export const invalidateTeachersCache =
  clearTeachersCache;

export {
  normalizeFilters as normalizeTeacherFilters,
  normalizeTeacherPayload,
};

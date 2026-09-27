import {
  api,
} from "../Axios";

import {
  getApiError,
} from "../helpers/getApiError";

const ENDPOINT =
  "/subjects";

const CACHE_TTL =
  30_000;

const queryCache =
  new Map();

const pendingRequests =
  new Map();

const normalizeFilters = (
  filters = {}
) => {
  const normalized = {};

  Object.entries(
    filters || {}
  ).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }

      normalized[key] =
        value;
    }
  );

  return normalized;
};

const getCacheKey = (
  endpoint,
  params = {}
) =>
  `${endpoint}:${JSON.stringify(
    normalizeFilters(params)
  )}`;

const getCachedValue = (
  key
) => {
  const cached =
    queryCache.get(key);

  if (!cached) {
    return null;
  }

  if (
    Date.now() -
      cached.createdAt >
    CACHE_TTL
  ) {
    queryCache.delete(key);
    return null;
  }

  return cached.value;
};

const setCachedValue = (
  key,
  value
) => {
  queryCache.set(
    key,
    {
      value,
      createdAt:
        Date.now(),
    }
  );
};

const requestWithCache =
  async ({
    key,
    request,
    force = false,
  }) => {
    if (!force) {
      const cached =
        getCachedValue(key);

      if (cached) {
        return cached;
      }

      if (
        pendingRequests.has(
          key
        )
      ) {
        return pendingRequests.get(
          key
        );
      }
    }

    const pending =
      request()
        .then((value) => {
          if (
            value?.status !==
            false
          ) {
            setCachedValue(
              key,
              value
            );
          }

          return value;
        })
        .finally(() => {
          pendingRequests.delete(
            key
          );
        });

    pendingRequests.set(
      key,
      pending
    );

    return pending;
  };

export const invalidateSubjectsCache =
  () => {
    queryCache.clear();
  };

export const fetchSubjects =
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

    const key =
      getCacheKey(
        ENDPOINT,
        normalizedFilters
      );

    return requestWithCache({
      key,
      force,

      request: async () => {
        try {
          const response =
            await api.get(
              ENDPOINT,
              {
                params:
                  normalizedFilters,
              }
            );

          return response.data;
        } catch (error) {
          return getApiError(
            error,
            "تعذر تحميل المواد الدراسية"
          );
        }
      },
    });
  };

export const fetchSubjectsList =
  async ({
    force = false,
  } = {}) => {
    const endpoint =
      `${ENDPOINT}/list`;

    const key =
      getCacheKey(
        endpoint
      );

    return requestWithCache({
      key,
      force,

      request: async () => {
        try {
          const response =
            await api.get(
              endpoint
            );

          return response.data;
        } catch (error) {
          return getApiError(
            error,
            "تعذر تحميل قائمة المواد"
          );
        }
      },
    });
  };

export const fetchSingleSubject =
  async (
    id,
    {
      force = false,
    } = {}
  ) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    const endpoint =
      `${ENDPOINT}/${id}`;

    const key =
      getCacheKey(
        endpoint
      );

    return requestWithCache({
      key,
      force,

      request: async () => {
        try {
          const response =
            await api.get(
              endpoint
            );

          return response.data;
        } catch (error) {
          return getApiError(
            error,
            "تعذر تحميل بيانات المادة"
          );
        }
      },
    });
  };

export const fetchMyStudentSubjects =
  async ({
    force = false,
  } = {}) => {
    const endpoint =
      `${ENDPOINT}/student/me`;

    const key =
      getCacheKey(
        endpoint
      );

    return requestWithCache({
      key,
      force,

      request: async () => {
        try {
          const response =
            await api.get(
              endpoint
            );

          return response.data;
        } catch (error) {
          return getApiError(
            error,
            "تعذر تحميل مواد الطالب"
          );
        }
      },
    });
  };

export const fetchMyTeacherSubjects =
  async ({
    force = false,
  } = {}) => {
    const endpoint =
      `${ENDPOINT}/teacher/me`;

    const key =
      getCacheKey(
        endpoint
      );

    return requestWithCache({
      key,
      force,

      request: async () => {
        try {
          const response =
            await api.get(
              endpoint
            );

          return response.data;
        } catch (error) {
          return getApiError(
            error,
            "تعذر تحميل مواد المعلم"
          );
        }
      },
    });
  };

export const addSubject =
  async (data) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          data
        );

      invalidateSubjectsCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر إضافة المادة"
      );
    }
  };

export const editSubject =
  async (
    data,
    id
  ) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${id}`,
          data
        );

      invalidateSubjectsCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر تعديل بيانات المادة"
      );
    }
  };

export const deleteSubject =
  async (id) => {
    if (!id) {
      return {
        status: false,
        message:
          "معرّف المادة غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${id}`
        );

      invalidateSubjectsCache();

      return response.data;
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف المادة"
      );
    }
  };

export {
  normalizeFilters as normalizeSubjectFilters,
};

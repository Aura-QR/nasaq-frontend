import {
  api,
} from "../Axios";

import {
  getApiError,
} from "../helpers/getApiError";

const ENDPOINT =
  "/grade-levels";

const CACHE_TTL =
  15_000;

const cache =
  new Map();

const pending =
  new Map();

const normalizeId = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object"
  ) {
    return String(
      value._id ||
      value.id ||
      ""
    ).trim();
  }

  return String(
    value || ""
  ).trim();
};

const normalizeResponse = (
  response
) => {
  const payload =
    response?.data;

  if (
    payload?.status ===
      false
  ) {
    return {
      status: false,

      message:
        payload?.message ||
        "فشلت العملية",

      data:
        payload?.data,

      pagination:
        payload?.pagination,
    };
  }

  return {
    status: true,

    message:
      payload?.message ||
      "Success",

    data:
      payload?.data ??
      payload,

    pagination:
      payload?.pagination,
  };
};

const normalizeError = (
  error,
  fallback
) => {
  const parsed =
    getApiError(
      error,
      fallback
    );

  return {
    status: false,

    message:
      parsed?.message ||
      (
        typeof parsed ===
          "string"
          ? parsed
          : fallback
      ),

    statusCode:
      error?.response
        ?.status,
  };
};

const requestCached =
  async ({
    key,
    request,
    force = false,
  }) => {
    const cached =
      cache.get(key);

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
      pending.has(key)
    ) {
      return pending.get(key);
    }

    const promise =
      request()
        .then((result) => {
          cache.set(
            key,
            {
              value:
                result,

              createdAt:
                Date.now(),
            }
          );

          return result;
        })
        .finally(() => {
          pending.delete(
            key
          );
        });

    pending.set(
      key,
      promise
    );

    return promise;
  };

export const invalidateGradeLevelsCache =
  () => {
    cache.clear();
  };

export const fetchGradeLevels =
  async ({
    stageId,
    force = false,
  } = {}) => {
    const normalizedStageId =
      normalizeId(stageId);

    const params =
      normalizedStageId
        ? {
            stageId:
              normalizedStageId,
          }
        : undefined;

    const key =
      normalizedStageId
        ? `grade-levels:list:${normalizedStageId}`
        : "grade-levels:list";

    return requestCached({
      key,
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                ENDPOINT,
                {
                  params,
                }
              );

            return normalizeResponse(
              response
            );
          } catch (error) {
            return normalizeError(
              error,
              "تعذر تحميل الصفوف الدراسية"
            );
          }
        },
    });
  };

export const fetchGradeLevelsByStage =
  async (
    stageId,
    {
      force = false,
    } = {}
  ) => {
    const normalizedStageId =
      normalizeId(stageId);

    if (!normalizedStageId) {
      return {
        status: false,
        message:
          "معرّف المرحلة غير موجود",
      };
    }

    return requestCached({
      key:
        `grade-levels:stage:${normalizedStageId}`,
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                `${ENDPOINT}/by-stage/${normalizedStageId}`
              );

            return normalizeResponse(
              response
            );
          } catch (firstError) {
            if (
              firstError?.response
                ?.status !== 404
            ) {
              return normalizeError(
                firstError,
                "تعذر تحميل صفوف المرحلة"
              );
            }

            try {
              const response =
                await api.get(
                  ENDPOINT,
                  {
                    params: {
                      stageId:
                        normalizedStageId,
                    },
                  }
                );

              return normalizeResponse(
                response
              );
            } catch (secondError) {
              return normalizeError(
                secondError,
                "تعذر تحميل صفوف المرحلة"
              );
            }
          }
        },
    });
  };

export const fetchGradeLevelById =
  async (
    id,
    {
      force = false,
    } = {}
  ) => {
    const gradeLevelId =
      normalizeId(id);

    if (!gradeLevelId) {
      return {
        status: false,
        message:
          "معرّف الصف الدراسي غير موجود",
      };
    }

    return requestCached({
      key:
        `grade-levels:${gradeLevelId}`,
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                `${ENDPOINT}/${gradeLevelId}`
              );

            return normalizeResponse(
              response
            );
          } catch (error) {
            return normalizeError(
              error,
              "تعذر تحميل بيانات الصف الدراسي"
            );
          }
        },
    });
  };

export const fetchNextGradeLevel =
  async (
    id,
    {
      force = false,
    } = {}
  ) => {
    const gradeLevelId =
      normalizeId(id);

    if (!gradeLevelId) {
      return {
        status: false,
        message:
          "معرّف الصف الدراسي غير موجود",
      };
    }

    return requestCached({
      key:
        `grade-levels:next:${gradeLevelId}`,
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                `${ENDPOINT}/next/${gradeLevelId}`
              );

            return normalizeResponse(
              response
            );
          } catch (error) {
            return normalizeError(
              error,
              "تعذر تحميل الصف الدراسي التالي"
            );
          }
        },
    });
  };

export const createGradeLevel =
  async (payload) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          {
            stageId:
              normalizeId(
                payload
                  ?.stageId
              ),

            name:
              String(
                payload?.name ||
                ""
              ).trim(),

            order:
              Number(
                payload?.order
              ),
          }
        );

      invalidateGradeLevelsCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر إضافة الصف الدراسي"
      );
    }
  };

export const updateGradeLevel =
  async (
    id,
    payload
  ) => {
    const gradeLevelId =
      normalizeId(id);

    if (!gradeLevelId) {
      return {
        status: false,
        message:
          "معرّف الصف الدراسي غير موجود",
      };
    }

    const body =
      Object.fromEntries(
        Object.entries({
          stageId:
            payload?.stageId !==
              undefined
              ? normalizeId(
                  payload
                    .stageId
                )
              : undefined,

          name:
            payload?.name !==
              undefined
              ? String(
                  payload.name
                ).trim()
              : undefined,

          order:
            payload?.order !==
              undefined
              ? Number(
                  payload.order
                )
              : undefined,
        }).filter(
          ([, value]) =>
            value !==
              undefined &&
            value !== ""
        )
      );

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${gradeLevelId}`,
          body
        );

      invalidateGradeLevelsCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر تعديل الصف الدراسي"
      );
    }
  };

export const deleteGradeLevel =
  async (id) => {
    const gradeLevelId =
      normalizeId(id);

    if (!gradeLevelId) {
      return {
        status: false,
        message:
          "معرّف الصف الدراسي غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${gradeLevelId}`
        );

      invalidateGradeLevelsCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر حذف الصف الدراسي"
      );
    }
  };

export {
  normalizeId as normalizeGradeLevelId,
};

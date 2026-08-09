import {
  api,
} from "../Axios";

import {
  getApiError,
} from "../helpers/getApiError";

const ENDPOINT =
  "/stages";

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
              value: result,
              createdAt:
                Date.now(),
            }
          );

          return result;
        })
        .finally(() => {
          pending.delete(key);
        });

    pending.set(
      key,
      promise
    );

    return promise;
  };

export const invalidateStagesCache =
  () => {
    cache.clear();
  };

export const fetchStages =
  async ({
    force = false,
  } = {}) =>
    requestCached({
      key: "stages:list",
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                ENDPOINT
              );

            return normalizeResponse(
              response
            );
          } catch (error) {
            return normalizeError(
              error,
              "تعذر تحميل المراحل الدراسية"
            );
          }
        },
    });

export const fetchStageById =
  async (
    id,
    {
      force = false,
    } = {}
  ) => {
    const stageId =
      normalizeId(id);

    if (!stageId) {
      return {
        status: false,
        message:
          "معرّف المرحلة غير موجود",
      };
    }

    return requestCached({
      key:
        `stages:${stageId}`,
      force,

      request:
        async () => {
          try {
            const response =
              await api.get(
                `${ENDPOINT}/${stageId}`
              );

            return normalizeResponse(
              response
            );
          } catch (error) {
            return normalizeError(
              error,
              "تعذر تحميل بيانات المرحلة"
            );
          }
        },
    });
  };

export const createStage =
  async (payload) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          {
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

      invalidateStagesCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر إضافة المرحلة الدراسية"
      );
    }
  };

export const updateStage =
  async (
    id,
    payload
  ) => {
    const stageId =
      normalizeId(id);

    if (!stageId) {
      return {
        status: false,
        message:
          "معرّف المرحلة غير موجود",
      };
    }

    const body =
      Object.fromEntries(
        Object.entries({
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
          `${ENDPOINT}/${stageId}`,
          body
        );

      invalidateStagesCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر تعديل المرحلة الدراسية"
      );
    }
  };

export const deleteStage =
  async (id) => {
    const stageId =
      normalizeId(id);

    if (!stageId) {
      return {
        status: false,
        message:
          "معرّف المرحلة غير موجود",
      };
    }

    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${stageId}`
        );

      invalidateStagesCache();

      return normalizeResponse(
        response
      );
    } catch (error) {
      return normalizeError(
        error,
        "تعذر حذف المرحلة الدراسية"
      );
    }
  };

export {
  normalizeId as normalizeStageId,
};

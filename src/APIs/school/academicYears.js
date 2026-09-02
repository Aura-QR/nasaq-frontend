import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/academic-years";
const CACHE_TTL = 15000;

const cache = new Map();
const pending = new Map();

const normalizeId = (value) =>
  String(value?._id || value?.id || value || "").trim();

const normalizeResponse = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination: payload?.pagination,
  };
};

const normalizeError = (error, fallback) => {
  const parsed = getApiError(error, fallback);

  return {
    status: false,
    message:
      parsed?.message ||
      (typeof parsed === "string" ? parsed : fallback),
    statusCode:
      parsed?.statusCode ||
      error?.response?.status,
  };
};

const cachedRequest = async (
  key,
  request,
  { force = false } = {}
) => {
  const saved = cache.get(key);

  if (
    !force &&
    saved &&
    Date.now() - saved.createdAt < CACHE_TTL
  ) {
    return saved.value;
  }

  if (!force && pending.has(key)) {
    return pending.get(key);
  }

  const promise = request()
    .then((value) => {
      cache.set(key, {
        value,
        createdAt: Date.now(),
      });

      return value;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, promise);

  return promise;
};

export const invalidateAcademicYearsCache = () =>
  cache.clear();

export const fetchAcademicYears = async (
  { force = false } = {}
) =>
  cachedRequest(
    "academic-years:list",
    async () => {
      try {
        return normalizeResponse(
          await api.get(ENDPOINT)
        );
      } catch (error) {
        return normalizeError(
          error,
          "تعذر تحميل السنوات الدراسية"
        );
      }
    },
    { force }
  );

export const fetchActiveAcademicYear = async (
  { force = false } = {}
) =>
  cachedRequest(
    "academic-years:active",
    async () => {
      try {
        return normalizeResponse(
          await api.get(`${ENDPOINT}/active`)
        );
      } catch (error) {
        return normalizeError(
          error,
          "تعذر تحميل السنة الدراسية النشطة"
        );
      }
    },
    { force }
  );

export const fetchAcademicYearById = async (
  id,
  { force = false } = {}
) => {
  const academicYearId = normalizeId(id);

  if (!academicYearId) {
    return {
      status: false,
      message: "معرّف السنة الدراسية غير موجود",
    };
  }

  return cachedRequest(
    `academic-years:${academicYearId}`,
    async () => {
      try {
        return normalizeResponse(
          await api.get(
            `${ENDPOINT}/${academicYearId}`
          )
        );
      } catch (error) {
        return normalizeError(
          error,
          "تعذر تحميل بيانات السنة الدراسية"
        );
      }
    },
    { force }
  );
};

export const createAcademicYear = async (payload) => {
  try {
    const response = await api.post(
      ENDPOINT,
      {
        name: String(
          payload?.name || ""
        ).trim(),
        startDate: payload?.startDate,
        endDate: payload?.endDate,
      }
    );

    invalidateAcademicYearsCache();

    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(
      error,
      "تعذر إنشاء السنة الدراسية"
    );
  }
};

export const updateAcademicYear = async (
  id,
  payload
) => {
  const academicYearId = normalizeId(id);

  if (!academicYearId) {
    return {
      status: false,
      message: "معرّف السنة الدراسية غير موجود",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${academicYearId}`,
      {
        name: String(
          payload?.name || ""
        ).trim(),
        startDate: payload?.startDate,
        endDate: payload?.endDate,
      }
    );

    invalidateAcademicYearsCache();

    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(
      error,
      "تعذر تعديل السنة الدراسية"
    );
  }
};

export const updateAcademicYearSetupStep = async (
  id,
  setupStep = "setup_terms"
) => {
  const academicYearId = normalizeId(id);

  if (!academicYearId) {
    return {
      status: false,
      message: "معرّف السنة الدراسية غير موجود",
    };
  }

  /*
   * Latest Postman collection sends:
   *   { setupStep: "setup_terms" }
   *
   * The markdown documentation still shows the older numeric shape:
   *   { step: 2 }
   *
   * Prefer the deployed/Postman string shape. When a numeric value is
   * explicitly passed, keep compatibility with the documented DTO.
   */
  const requestBody =
    typeof setupStep === "number"
      ? { step: setupStep }
      : {
          setupStep: String(
            setupStep || "setup_terms"
          ).trim(),
        };

  try {
    const response = await api.patch(
      `${ENDPOINT}/${academicYearId}/setup-step`,
      requestBody
    );

    invalidateAcademicYearsCache();

    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(
      error,
      "تعذر تحديث خطوة تجهيز السنة"
    );
  }
};

/*
 * DELETE /academic-years/:id
 * Deletes an academic year by its Mongo ObjectId.
 */
export const deleteAcademicYear = async (id) => {
  const academicYearId = normalizeId(id);

  if (!academicYearId) {
    return {
      status: false,
      message: "معرّف السنة الدراسية غير موجود",
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${academicYearId}`
    );

    invalidateAcademicYearsCache();

    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(
      error,
      "تعذر حذف السنة الدراسية"
    );
  }
};

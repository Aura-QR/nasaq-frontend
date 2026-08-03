import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/terms";
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
    statusCode: error?.response?.status,
  };
};

const cachedRequest = async (key, request, { force = false } = {}) => {
  const saved = cache.get(key);
  if (!force && saved && Date.now() - saved.createdAt < CACHE_TTL) {
    return saved.value;
  }
  if (!force && pending.has(key)) return pending.get(key);

  const promise = request()
    .then((value) => {
      cache.set(key, { value, createdAt: Date.now() });
      return value;
    })
    .finally(() => pending.delete(key));

  pending.set(key, promise);
  return promise;
};

export const invalidateTermsCache = () => cache.clear();

export const fetchTermsByAcademicYear = async (
  academicYearId,
  { force = false } = {}
) => {
  const yearId = normalizeId(academicYearId);
  if (!yearId) {
    return { status: false, message: "معرّف السنة الدراسية غير موجود" };
  }

  return cachedRequest(
    `terms:year:${yearId}`,
    async () => {
      try {
        return normalizeResponse(
          await api.get(`${ENDPOINT}/by-year/${yearId}`)
        );
      } catch (firstError) {
        if (firstError?.response?.status !== 404) {
          return normalizeError(firstError, "تعذر تحميل الترمات");
        }

        try {
          return normalizeResponse(
            await api.get(ENDPOINT, {
              params: { academicYearId: yearId },
            })
          );
        } catch (secondError) {
          return normalizeError(secondError, "تعذر تحميل الترمات");
        }
      }
    },
    { force }
  );
};

export const createTerm = async (payload) => {
  try {
    const response = await api.post(ENDPOINT, {
      academicYearId: normalizeId(payload?.academicYearId),
      name: String(payload?.name || "").trim(),
      order: Number(payload?.order),
      startDate: payload?.startDate,
      endDate: payload?.endDate,
    });
    invalidateTermsCache();
    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(error, "تعذر إضافة الترم");
  }
};

export const createTermsBulk = async (academicYearId, terms) => {
  const yearId = normalizeId(academicYearId);
  if (!yearId) {
    return { status: false, message: "معرّف السنة الدراسية غير موجود" };
  }

  const normalizedTerms = (Array.isArray(terms) ? terms : []).map(
    (term) => ({
      name: String(term?.name || "").trim(),
      order: Number(term?.order),
      startDate: term?.startDate,
      endDate: term?.endDate,
    })
  );

  try {
    /* Preferred documented shape: academicYearId in the body. */
    const response = await api.post(`${ENDPOINT}/bulk`, {
      academicYearId: yearId,
      terms: normalizedTerms,
    });
    invalidateTermsCache();
    return normalizeResponse(response);
  } catch (firstError) {
    /*
     * Latest Postman also exposes /terms/bulk/:academicYearId.
     * Fall back only when the body route is not available or rejected.
     */
    if (![400, 404, 405, 422].includes(firstError?.response?.status)) {
      return normalizeError(firstError, "تعذر إنشاء الترمات");
    }

    try {
      const response = await api.post(`${ENDPOINT}/bulk/${yearId}`, {
        terms: normalizedTerms,
      });
      invalidateTermsCache();
      return normalizeResponse(response);
    } catch (secondError) {
      return normalizeError(secondError, "تعذر إنشاء الترمات");
    }
  }
};

export const copyTermsFromYear = async (
  targetYearId,
  sourceYearId,
  termOverrides = []
) => {
  const targetId = normalizeId(targetYearId);
  const sourceId = normalizeId(sourceYearId);
  if (!targetId || !sourceId) {
    return { status: false, message: "اختر السنة المصدر والمستهدفة" };
  }

  const body =
    Array.isArray(termOverrides) && termOverrides.length > 0
      ? { termOverrides }
      : {};

  try {
    const response = await api.post(
      `${ENDPOINT}/copy-from/${targetId}/${sourceId}`,
      body
    );
    invalidateTermsCache();
    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(error, "تعذر نسخ هيكل الترمات");
  }
};

export const updateTerm = async (id, payload) => {
  const termId = normalizeId(id);
  if (!termId) {
    return { status: false, message: "معرّف الترم غير موجود" };
  }

  try {
    const response = await api.patch(`${ENDPOINT}/${termId}`, {
      name: String(payload?.name || "").trim(),
      order: Number(payload?.order),
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      status: payload?.status,
    });
    invalidateTermsCache();
    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(error, "تعذر تعديل الترم");
  }
};

export const deleteTerm = async (id) => {
  const termId = normalizeId(id);
  if (!termId) {
    return { status: false, message: "معرّف الترم غير موجود" };
  }

  try {
    const response = await api.delete(`${ENDPOINT}/${termId}`);
    invalidateTermsCache();
    return normalizeResponse(response);
  } catch (error) {
    return normalizeError(error, "تعذر حذف الترم");
  }
};

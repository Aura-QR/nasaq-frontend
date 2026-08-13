import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/lectures";
const CACHE_TTL = 15000;
const cache = new Map();
const pending = new Map();

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }

  return String(value || "").trim();
};

const normalizeSuccess = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
      pagination: payload?.pagination ?? null,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination: payload?.pagination ?? null,
  };
};

const normalizeFailure = (value, fallback) => ({
  status: false,
  message:
    value?.message ||
    value?.data?.message ||
    (typeof value === "string" ? value : fallback),
});

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );

const getCached = async (
  endpoint,
  params,
  fallback,
  { force = false } = {}
) => {
  const cleanedParams = cleanParams(params);
  const key = `${endpoint}:${JSON.stringify(cleanedParams)}`;
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

  const request = api
    .get(endpoint, { params: cleanedParams })
    .then(normalizeSuccess)
    .then((result) => {
      cache.set(key, {
        value: result,
        createdAt: Date.now(),
      });

      return result;
    })
    .catch((error) =>
      normalizeFailure(
        getApiError(error, fallback),
        fallback
      )
    )
    .finally(() => pending.delete(key));

  pending.set(key, request);
  return request;
};

export const invalidateLecturesCache = () => {
  cache.clear();
};

export const fetchLectures = async (
  filters = {},
  options = {}
) =>
  getCached(
    ENDPOINT,
    filters,
    "تعذر تحميل الحصص",
    options
  );

export const fetchLecturesList = async (
  options = {}
) =>
  getCached(
    `${ENDPOINT}/list`,
    {},
    "تعذر تحميل قائمة الحصص",
    options
  );

export const fetchTeacherMyClasses = async (
  filters = {},
  options = {}
) =>
  getCached(
    `${ENDPOINT}/teacher/me/classes`,
    filters,
    "تعذر تحميل فصول المعلم",
    options
  );

export const fetchSingleLecture = async (
  id,
  options = {}
) => {
  const lectureId = normalizeId(id);

  if (!lectureId) {
    return {
      status: false,
      message: "معرّف الحصة غير موجود",
    };
  }

  return getCached(
    `${ENDPOINT}/${lectureId}`,
    {},
    "تعذر تحميل بيانات الحصة",
    options
  );
};

export const fetchTermsByAcademicYear = async (
  academicYearId,
  options = {}
) => {
  const yearId = normalizeId(academicYearId);

  if (!yearId) {
    return {
      status: false,
      message: "معرّف السنة الدراسية غير موجود",
    };
  }

  return getCached(
    `/terms/by-year/${yearId}`,
    {},
    "تعذر تحميل الترم",
    options
  );
};

export const fetchSubjectOfferings = async (
  { gradeLevelId, termId } = {},
  options = {}
) => {
  const gradeId = normalizeId(gradeLevelId);
  const normalizedTermId = normalizeId(termId);

  if (!gradeId || !normalizedTermId) {
    return {
      status: false,
      message: "اختر الفصل والترم أولًا",
    };
  }

  return getCached(
    `/subject-offerings/by-term/${normalizedTermId}`,
    {},
    "تعذر تحميل المواد المفعلة",
    options
  );
};

export const fetchTeacherAssignments = async (
  filters = {},
  options = {}
) =>
  getCached(
    "/teacher-assignments",
    filters,
    "تعذر تحميل إسنادات المعلمين",
    options
  );

export const normalizeLecturePayload = (
  data = {}
) => {
  const payload = {
    classId: normalizeId(data.classId),
    subjectOfferingId: normalizeId(
      data.subjectOfferingId
    ),
    termId: normalizeId(data.termId),
    dayOfWeek: String(data.dayOfWeek || "")
      .trim()
      .toLowerCase(),
    slot: Number(data.slot),
  };

  const teacherId = normalizeId(data.teacherId);

  if (teacherId) {
    payload.teacherId = teacherId;
  }

  return payload;
};

export const addLecture = async (data) => {
  try {
    const response = await api.post(
      ENDPOINT,
      normalizeLecturePayload(data)
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(error, "تعذر إضافة الحصة"),
      "تعذر إضافة الحصة"
    );
  }
};

export const editLecture = async (data, id) => {
  const lectureId = normalizeId(id);

  if (!lectureId) {
    return {
      status: false,
      message: "معرّف الحصة غير موجود",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${lectureId}`,
      normalizeLecturePayload(data)
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(error, "تعذر تعديل الحصة"),
      "تعذر تعديل الحصة"
    );
  }
};

export const deleteLecture = async (id) => {
  const lectureId = normalizeId(id);

  if (!lectureId) {
    return {
      status: false,
      message: "معرّف الحصة غير موجود",
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${lectureId}`
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(error, "تعذر حذف الحصة"),
      "تعذر حذف الحصة"
    );
  }
};

import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/lectures";
const CACHE_TTL = 15000;
const cache = new Map();
const pending = new Map();
let cacheGeneration = 0;

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
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
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

  const requestGeneration = cacheGeneration;

  const request = api
    .get(endpoint, { params: cleanedParams })
    .then(normalizeSuccess)
    .then((result) => {
      // لو حصل تعديل أثناء ما الـ GET القديم لسه شغال،
      // ممنوع يرجّع البيانات القديمة للكاش بعد الـ invalidate.
      if (requestGeneration === cacheGeneration) {
        cache.set(key, {
          value: result,
          createdAt: Date.now(),
        });
      }

      return result;
    })
    .catch((error) =>
      normalizeFailure(
        getApiError(error, fallback),
        fallback
      )
    )
    .finally(() => {
      if (pending.get(key) === request) {
        pending.delete(key);
      }
    });

  pending.set(key, request);
  return request;
};

export const invalidateLecturesCache = () => {
  cacheGeneration += 1;
  cache.clear();
  pending.clear();
};

export const fetchLectures = async (
  filters = {},
  options = {}
) =>
  getCached(
    ENDPOINT,
    filters,
    "تعذر تحميل الحصص",
    {
      ...options,
      // الحصص بيانات تشغيلية تتغير باستمرار؛ لا نعرض Snapshot قديم.
      force: options.force ?? true,
    }
  );

export const fetchLecturesList = async (
  options = {}
) =>
  getCached(
    `${ENDPOINT}/list`,
    {},
    "تعذر تحميل قائمة الحصص",
    {
      ...options,
      force: options.force ?? true,
    }
  );

/**
 * GET /lectures/teacher/me/classes
 * يرجع الفصول المرتبطة بالمعلم الحالي من التوكن مباشرة.
 *
 * مهم:
 * - لا نرسل teacherId من الفرونت.
 * - مناسب لصفحات بوابة المعلم مثل الحضور والمشروعات.
 * - نستخدم force افتراضيًا حتى لا تظهر بيانات قديمة بعد تعديل الجدول.
 */
export const fetchTeacherMyClasses = async (
  filters = {},
  options = {}
) =>
  getCached(
    `${ENDPOINT}/teacher/me/classes`,
    filters,
    "تعذر تحميل فصول المعلم",
    {
      ...options,
      force: options.force ?? true,
    }
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
    {
      ...options,
      force: options.force ?? true,
    }
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

export const addTeacherAssignment = async (
  data = {}
) => {
  const teacherId = normalizeId(
    data?.teacherId || data?.teacher
  );

  const subjectOfferingId = normalizeId(
    data?.subjectOfferingId ||
      data?.subjectOffering
  );

  if (!teacherId || !subjectOfferingId) {
    return {
      status: false,
      message:
        "المعلم وعرض المادة مطلوبان",
    };
  }

  try {
    const response = await api.post(
      "/teacher-assignments",
      {
        teacherId,
        subjectOfferingId,
      }
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(
        error,
        "تعذر إضافة إسناد المعلم"
      ),
      "تعذر إضافة إسناد المعلم"
    );
  }
};

export const deleteTeacherAssignment = async (
  id
) => {
  const assignmentId = normalizeId(id);

  if (!assignmentId) {
    return {
      status: false,
      message:
        "معرّف إسناد المعلم غير موجود",
    };
  }

  try {
    const response = await api.delete(
      `/teacher-assignments/${assignmentId}`
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(
        error,
        "تعذر حذف إسناد المعلم"
      ),
      "تعذر حذف إسناد المعلم"
    );
  }
};

export const normalizeLecturePayload = (
  data = {}
) => {
  const payload = {
    classId: normalizeId(data.classId),
    subjectOfferingId: normalizeId(
      data.subjectOfferingId
    ),
    termId: normalizeId(data.termId),
    dayOfWeek: String(
      data.dayOfWeek || ""
    )
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

    const normalized = normalizeSuccess(response);

    // تأكيد من السيرفر نفسه بعد الحفظ، وليس من أي كاش محلي.
    try {
      const fresh = await api.get(
        `${ENDPOINT}/${lectureId}`,
        {
          params: {
            _fresh: Date.now(),
          },
        }
      );

      invalidateLecturesCache();

      return {
        ...normalized,
        data:
          fresh?.data?.data ??
          fresh?.data ??
          normalized.data,
      };
    } catch {
      return normalized;
    }
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

/**
 * POST /lectures/copy-from/:targetYearId/:targetTermId/:sourceTermId
 * Body: none
 *
 * النتيجة قد تحتوي:
 * created / unresolved / needsTeacher / teacherConflict
 */
export const copyLectureSchedule = async (
  targetYearId,
  targetTermId,
  sourceTermId
) => {
  const normalizedTargetYearId =
    normalizeId(targetYearId);
  const normalizedTargetTermId =
    normalizeId(targetTermId);
  const normalizedSourceTermId =
    normalizeId(sourceTermId);

  if (
    !normalizedTargetYearId ||
    !normalizedTargetTermId ||
    !normalizedSourceTermId
  ) {
    return {
      status: false,
      message:
        "اختر السنة الهدف والترم المصدر والترم الهدف أولًا",
    };
  }

  if (
    normalizedTargetTermId ===
    normalizedSourceTermId
  ) {
    return {
      status: false,
      message:
        "الترم المصدر والترم الهدف يجب أن يكونا مختلفين",
    };
  }

  try {
    const response = await api.post(
      `${ENDPOINT}/copy-from/${normalizedTargetYearId}/${normalizedTargetTermId}/${normalizedSourceTermId}`
    );

    invalidateLecturesCache();
    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      getApiError(
        error,
        "تعذر نسخ الجدول الدراسي"
      ),
      "تعذر نسخ الجدول الدراسي"
    );
  }
};

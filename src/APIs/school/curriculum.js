import { api } from "../Axios";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

const unwrap = (response) => {
  const payload = response?.data;

  if (payload?.status === false) {
    return {
      status: false,
      message: payload?.message || "فشلت العملية",
      data: payload?.data,
      statusCode: payload?.statusCode,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination: payload?.pagination || null,
  };
};

const fail = (error, fallback) => ({
  status: false,
  statusCode:
    error?.response?.status ||
    error?.response?.data?.statusCode ||
    500,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback,
  data: error?.response?.data?.data,
});

/**
 * GET /curriculum/units?subjectId=&gradeLevelId=
 *
 * Important: curriculum is school-scoped by the backend. Deliberately no
 * client-side cache is used here so rows from two schools can never be mixed.
 */
export const fetchCurriculumUnits = async ({ subjectId, gradeLevelId } = {}) => {
  const subject = normalizeId(subjectId);
  const grade = normalizeId(gradeLevelId);

  if (!subject || !grade) {
    return {
      status: false,
      message: "تعذر تحديد المادة أو الصف الدراسي للحصة",
      data: [],
    };
  }

  try {
    return unwrap(
      await api.get("/curriculum/units", {
        params: {
          subjectId: subject,
          gradeLevelId: grade,
        },
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل وحدات المنهج");
  }
};

/** GET /curriculum/units/:id/lessons */
export const fetchCurriculumLessons = async (unitId) => {
  const id = normalizeId(unitId);

  if (!id) {
    return {
      status: false,
      message: "اختر الوحدة أولًا",
      data: [],
    };
  }

  try {
    return unwrap(await api.get(`/curriculum/units/${id}/lessons`));
  } catch (error) {
    return fail(error, "تعذر تحميل دروس الوحدة");
  }
};


/**
 * GET /catalog/subjects
 *
 * The platform catalogue: 162 courses of the national curriculum, shared and
 * read-only. `q` matches the subject name or the course variant — without it
 * the caller pages through 162 rows to find one book.
 *
 * A row is not identified by `name` alone. The catalogue holds 35 courses
 * called العلوم and 24 called الرياضيات, so `variant`, `unitCount`,
 * `lessonCount` and `unitPreview` are what a picker needs to show.
 */
export const fetchCatalogSubjects = async ({ page = 1, limit = 100, q } = {}) => {
  const term = String(q || "").trim();

  try {
    return unwrap(
      await api.get("/catalog/subjects", {
        // Sent only when there is one: the backend validates the query with
        // forbidNonWhitelisted, and an empty q is simply noise.
        params: { page, limit, ...(term ? { q: term } : {}) },
      })
    );
  } catch (error) {
    return fail(error, "تعذر تحميل مواد المنهج الوطني");
  }
};

export const fetchCatalogSubjectUnits = async (catalogSubjectId) => {
  const id = normalizeId(catalogSubjectId);

  if (!id) {
    return {
      status: false,
      message: "اختر مادة من المنهج الوطني أولًا",
      data: [],
    };
  }

  try {
    return unwrap(await api.get(`/catalog/subjects/${id}/units`));
  } catch (error) {
    return fail(error, "تعذر تحميل وحدات المنهج الوطني");
  }
};

export const importSchoolCurriculum = async ({
  catalogSubjectId,
  subjectId,
  gradeLevelId,
} = {}) => {
  const body = {
    catalogSubjectId: normalizeId(catalogSubjectId),
    subjectId: normalizeId(subjectId),
    gradeLevelId: normalizeId(gradeLevelId),
  };

  if (!body.catalogSubjectId || !body.subjectId || !body.gradeLevelId) {
    return {
      status: false,
      message: "اختر مادة المنهج والمادة المدرسية والصف الدراسي",
    };
  }

  try {
    return unwrap(await api.post("/curriculum/import", body));
  } catch (error) {
    return fail(error, "تعذر استيراد المنهج إلى المدرسة");
  }
};

export const createCurriculumUnit = async (data = {}) => {
  const rawOrder = Number(data.order);
  const body = {
    subjectId: normalizeId(data.subjectId),
    gradeLevelId: normalizeId(data.gradeLevelId),
    name: String(data.name || "").trim(),
    // Current backend DTO requires a non-negative order. The screen derives
    // this automatically, so there is still no order input in the UI.
    order: Number.isFinite(rawOrder) && rawOrder >= 0 ? rawOrder : 0,
  };

  try {
    return unwrap(await api.post("/curriculum/units", body));
  } catch (error) {
    return fail(error, "تعذر إضافة الوحدة");
  }
};

export const updateCurriculumUnit = async (unitId, data = {}) => {
  const id = normalizeId(unitId);
  if (!id) return { status: false, message: "معرّف الوحدة غير موجود" };

  const body = {};
  if (Object.prototype.hasOwnProperty.call(data, "name")) {
    body.name = String(data.name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(data, "order")) {
    body.order = Number(data.order || 0);
  }

  try {
    return unwrap(await api.patch(`/curriculum/units/${id}`, body));
  } catch (error) {
    return fail(error, "تعذر تعديل الوحدة");
  }
};

export const deleteCurriculumUnit = async (unitId) => {
  const id = normalizeId(unitId);
  if (!id) return { status: false, message: "معرّف الوحدة غير موجود" };

  try {
    return unwrap(await api.delete(`/curriculum/units/${id}`));
  } catch (error) {
    return fail(error, "تعذر حذف الوحدة");
  }
};

export const createCurriculumLesson = async (unitId, data = {}) => {
  const id = normalizeId(unitId);
  if (!id) return { status: false, message: "معرّف الوحدة غير موجود" };

  try {
    return unwrap(await api.post(`/curriculum/units/${id}/lessons`, {
      name: String(data.name || "").trim(),
      order: Number(data.order || 0),
      ...(Array.isArray(data.objectives) ? { objectives: data.objectives } : {}),
    }));
  } catch (error) {
    return fail(error, "تعذر إضافة الدرس");
  }
};


/**
 * POST /curriculum/units/:id/lessons-bulk
 *
 * The backend cleans pasted table-of-contents text. `dryRun: true` returns the
 * exact cleaned preview without writing; `dryRun: false` commits the same text.
 */
export const bulkCurriculumLessons = async (unitId, { text, dryRun = false } = {}) => {
  const id = normalizeId(unitId);
  const value = String(text || "").trim();

  if (!id) {
    return { status: false, message: "معرّف الوحدة غير موجود" };
  }

  const names = value
    .split(/\r?\n/)
    .map((line) => String(line || "").trim())
    .filter(Boolean);

  if (!names.length) {
    return { status: false, message: "الصق أسماء الدروس أولًا" };
  }

  try {
    return unwrap(
      await api.post(`/curriculum/units/${id}/lessons-bulk`, {
        names,
        dryRun: Boolean(dryRun),
      })
    );
  } catch (error) {
    return fail(
      error,
      dryRun ? "تعذر معاينة الدروس" : "تعذر إضافة الدروس"
    );
  }
};

export const updateCurriculumLesson = async (lessonId, data = {}) => {
  const id = normalizeId(lessonId);
  if (!id) return { status: false, message: "معرّف الدرس غير موجود" };

  const body = {};
  if (Object.prototype.hasOwnProperty.call(data, "name")) {
    body.name = String(data.name || "").trim();
  }
  if (Object.prototype.hasOwnProperty.call(data, "order")) {
    body.order = Number(data.order || 0);
  }
  if (Object.prototype.hasOwnProperty.call(data, "objectives")) {
    body.objectives = Array.isArray(data.objectives) ? data.objectives : [];
  }

  try {
    return unwrap(await api.patch(`/curriculum/lessons/${id}`, body));
  } catch (error) {
    return fail(error, "تعذر تعديل الدرس");
  }
};

export const deleteCurriculumLesson = async (lessonId) => {
  const id = normalizeId(lessonId);
  if (!id) return { status: false, message: "معرّف الدرس غير موجود" };

  try {
    return unwrap(await api.delete(`/curriculum/lessons/${id}`));
  } catch (error) {
    return fail(error, "تعذر حذف الدرس");
  }
};

export default {
  fetchCurriculumUnits,
  fetchCurriculumLessons,
  fetchCatalogSubjects,
  fetchCatalogSubjectUnits,
  importSchoolCurriculum,
  createCurriculumUnit,
  updateCurriculumUnit,
  deleteCurriculumUnit,
  createCurriculumLesson,
  bulkCurriculumLessons,
  updateCurriculumLesson,
  deleteCurriculumLesson,
};

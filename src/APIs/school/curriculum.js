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


export const fetchCatalogSubjects = async ({ page = 1, limit = 100 } = {}) => {
  try {
    return unwrap(
      await api.get("/catalog/subjects", {
        params: { page, limit },
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
  try {
    return unwrap(await api.post("/curriculum/units", {
      subjectId: normalizeId(data.subjectId),
      gradeLevelId: normalizeId(data.gradeLevelId),
      name: String(data.name || "").trim(),
      order: Number(data.order || 0),
    }));
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
  updateCurriculumLesson,
  deleteCurriculumLesson,
};

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

export default {
  fetchCurriculumUnits,
  fetchCurriculumLessons,
};

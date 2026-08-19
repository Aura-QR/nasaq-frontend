import { api } from "../Axios";

const ENDPOINT = "/enrollments";

const normalizeId = (value) => {
  if (value && typeof value === "object") {
    return String(
      value._id ||
        value.id ||
        value.value ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeFailure = (
  error,
  fallback
) => ({
  status: false,
  message: getErrorMessage(
    error,
    fallback
  ),
  statusCode:
    error?.response?.status,
});

/**
 * GET /enrollments/promotion-preview/:targetAcademicYearId
 *
 * previousAcademicYearId is sent explicitly so the preview is always
 * calculated from the year selected by the admin instead of depending
 * on whichever year is currently active.
 */
export const fetchPromotionPreview = async (
  targetAcademicYearId,
  previousAcademicYearId
) => {
  const targetYearId =
    normalizeId(
      targetAcademicYearId
    );

  const sourceYearId =
    normalizeId(
      previousAcademicYearId
    );

  if (!targetYearId) {
    return {
      status: false,
      message:
        "السنة الدراسية الهدف مطلوبة",
    };
  }

  if (!sourceYearId) {
    return {
      status: false,
      message:
        "السنة الدراسية المصدر مطلوبة",
    };
  }

  if (targetYearId === sourceYearId) {
    return {
      status: false,
      message:
        "السنة المصدر والسنة الهدف يجب أن تكونا مختلفتين",
    };
  }

  try {
    const response =
      await api.get(
        `${ENDPOINT}/promotion-preview/${targetYearId}`,
        {
          params: {
            previousAcademicYearId:
              sourceYearId,
          },
        }
      );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل معاينة ترقية الطلاب"
    );
  }
};

/**
 * POST /enrollments/bulk-promote/:targetAcademicYearId
 *
 * Backend contract:
 * {
 *   promotions: [{ studentId, targetClassId }],
 *   excludedStudentIds: []
 * }
 *
 * There is deliberately no "action" field per student.
 */
export const bulkPromoteStudents = async (
  targetAcademicYearId,
  {
    promotions = [],
    excludedStudentIds = [],
  } = {}
) => {
  const targetYearId =
    normalizeId(
      targetAcademicYearId
    );

  if (!targetYearId) {
    return {
      status: false,
      message:
        "السنة الدراسية الهدف مطلوبة",
    };
  }

  const normalizedPromotions =
    promotions
      .map((item) => ({
        studentId:
          normalizeId(
            item?.studentId
          ),
        targetClassId:
          normalizeId(
            item?.targetClassId
          ),
      }))
      .filter(
        (item) =>
          item.studentId &&
          item.targetClassId
      );

  const normalizedExcludedIds =
    [
      ...new Set(
        excludedStudentIds
          .map(normalizeId)
          .filter(Boolean)
      ),
    ];

  if (
    !normalizedPromotions.length
  ) {
    return {
      status: false,
      message:
        "لا يوجد طلاب صالحون للترقية",
    };
  }

  try {
    const response =
      await api.post(
        `${ENDPOINT}/bulk-promote/${targetYearId}`,
        {
          promotions:
            normalizedPromotions,
          excludedStudentIds:
            normalizedExcludedIds,
        }
      );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تنفيذ ترقية الطلاب"
    );
  }
};

export default {
  fetchPromotionPreview,
  bulkPromoteStudents,
};

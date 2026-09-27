import { api } from "../Axios";

const ENDPOINT = "/enrollments";

const VALID_EXCLUSION_REASONS = new Set([
  "graduated",
  "transferred",
  "withdrawn",
]);

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
  data:
    error?.response?.data?.data ??
    error?.response?.data ??
    null,
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
 * New backend contract:
 * {
 *   previousAcademicYearId: "...",
 *   promotions: [{ studentId, targetClassId }],
 *   excludedStudents: [
 *     { studentId, reason: "graduated" | "transferred" | "withdrawn" }
 *   ]
 * }
 *
 * excludedStudentIds is still accepted by this frontend helper for
 * compatibility with any old caller and is converted to "withdrawn".
 */
export const bulkPromoteStudents = async (
  targetAcademicYearId,
  {
    previousAcademicYearId,
    promotions = [],
    excludedStudents = [],
    excludedStudentIds = [],
  } = {}
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

  const excludedMap =
    new Map();

  excludedStudents.forEach(
    (item) => {
      const studentId =
        normalizeId(
          item?.studentId
        );

      const reason =
        String(
          item?.reason || ""
        )
          .trim()
          .toLowerCase();

      if (
        studentId &&
        VALID_EXCLUSION_REASONS.has(
          reason
        )
      ) {
        excludedMap.set(
          studentId,
          {
            studentId,
            reason,
          }
        );
      }
    }
  );

  // Compatibility for any old screen/caller still sending ids only.
  excludedStudentIds
    .map(normalizeId)
    .filter(Boolean)
    .forEach((studentId) => {
      if (!excludedMap.has(studentId)) {
        excludedMap.set(
          studentId,
          {
            studentId,
            reason: "withdrawn",
          }
        );
      }
    });

  const normalizedExcludedStudents =
    [...excludedMap.values()];

  if (
    !normalizedPromotions.length &&
    !normalizedExcludedStudents.length
  ) {
    return {
      status: false,
      message:
        "لا توجد تغييرات صالحة للتنفيذ",
    };
  }

  try {
    const response =
      await api.post(
        `${ENDPOINT}/bulk-promote/${targetYearId}`,
        {
          previousAcademicYearId:
            sourceYearId,
          promotions:
            normalizedPromotions,
          excludedStudents:
            normalizedExcludedStudents,
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

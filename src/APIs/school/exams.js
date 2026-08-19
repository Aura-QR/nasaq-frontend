import { api } from "../Axios";

const ENDPOINT = "/exams";

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
      statusCode: payload?.statusCode,
      data: payload?.data,
    };
  }

  return {
    status: true,
    message: payload?.message || "Success",
    data: payload?.data ?? payload,
    pagination:
      payload?.pagination ||
      payload?.data?.pagination ||
      null,
  };
};

const normalizeFailure = (
  error,
  fallback = "حدث خطأ ما"
) => ({
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

export const fetchExams = async (filters = {}) => {
  try {
    const response = await api.get(ENDPOINT, {
      params: filters,
    });

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل الاختبارات"
    );
  }
};

/*
 * Alias للتوافق مع صفحات المعلم القديمة.
 * قائمة اختبارات المعلم تستخدم نفس GET /exams.
 */
export const fetchTeacherExams = fetchExams;

export const fetchSingleExam = async (id) => {
  const examId = normalizeId(id);

  if (!examId) {
    return {
      status: false,
      message: "معرّف الاختبار غير موجود",
    };
  }

  try {
    const response = await api.get(
      `${ENDPOINT}/${examId}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل بيانات الاختبار"
    );
  }
};

/**
 * GET /exams/:examId/results
 *
 * المصدر الرسمي لنتائج الاختبار:
 * - enrolledCount
 * - startedCount
 * - gradedCount
 * - results[]
 */
export const fetchExamResults = async (id) => {
  const examId = normalizeId(id);

  if (!examId) {
    return {
      status: false,
      message: "معرّف الاختبار غير موجود",
    };
  }

  try {
    const response = await api.get(
      `${ENDPOINT}/${examId}/results`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل نتائج الاختبار"
    );
  }
};

export const addExam = async (data) => {
  try {
    const response = await api.post(
      ENDPOINT,
      data
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر إضافة الاختبار"
    );
  }
};

export const editExam = async (data, id) => {
  const examId = normalizeId(id);

  if (!examId) {
    return {
      status: false,
      message: "معرّف الاختبار غير موجود",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${examId}`,
      data
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل الاختبار"
    );
  }
};

export const deleteExam = async (id) => {
  const examId = normalizeId(id);

  if (!examId) {
    return {
      status: false,
      message: "معرّف الاختبار غير موجود",
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${examId}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف الاختبار"
    );
  }
};

export const addExamQuestion = async (
  examId,
  question
) => {
  const id = normalizeId(examId);

  if (!id) {
    return {
      status: false,
      message: "معرّف الاختبار غير موجود",
    };
  }

  try {
    const response = await api.post(
      `${ENDPOINT}/${id}/questions`,
      question
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر إضافة السؤال"
    );
  }
};

export const editExamQuestion = async (
  examId,
  questionId,
  question
) => {
  const id = normalizeId(examId);
  const qid = normalizeId(questionId);

  if (!id || !qid) {
    return {
      status: false,
      message: "بيانات الاختبار أو السؤال غير مكتملة",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${id}/questions/${qid}`,
      question
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل السؤال"
    );
  }
};

export const deleteExamQuestion = async (
  examId,
  questionId
) => {
  const id = normalizeId(examId);
  const qid = normalizeId(questionId);

  if (!id || !qid) {
    return {
      status: false,
      message: "بيانات الاختبار أو السؤال غير مكتملة",
    };
  }

  try {
    const response = await api.delete(
      `${ENDPOINT}/${id}/questions/${qid}`
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حذف السؤال"
    );
  }
};

/**
 * PATCH /exams/:examId/students/:studentId/grade
 * Body الحالي للباك:
 * { achievedGrade: number }
 */
export const gradeExamStudent = async (
  examId,
  studentId,
  scoreOrPayload
) => {
  const id = normalizeId(examId);
  const sid = normalizeId(studentId);

  const numericScore = Number(
    scoreOrPayload &&
      typeof scoreOrPayload === "object"
      ? scoreOrPayload.achievedGrade ??
          scoreOrPayload.score ??
          scoreOrPayload.grade
      : scoreOrPayload
  );

  if (!id || !sid) {
    return {
      status: false,
      message:
        "بيانات الاختبار أو الطالب غير مكتملة",
    };
  }

  if (!Number.isFinite(numericScore)) {
    return {
      status: false,
      message: "درجة الطالب غير صالحة",
    };
  }

  try {
    const response = await api.patch(
      `${ENDPOINT}/${id}/students/${sid}/grade`,
      {
        achievedGrade: numericScore,
      }
    );

    return normalizeSuccess(response);
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر حفظ درجة الطالب"
    );
  }
};

export const overrideExamGrade =
  gradeExamStudent;

export default {
  fetchExams,
  fetchTeacherExams,
  fetchSingleExam,
  fetchExamResults,
  addExam,
  editExam,
  deleteExam,
  addExamQuestion,
  editExamQuestion,
  deleteExamQuestion,
  gradeExamStudent,
  overrideExamGrade,
};

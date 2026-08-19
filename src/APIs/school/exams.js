import { api } from "../Axios";

const ENDPOINT = "/exams";

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
  message: getErrorMessage(error, fallback),
  statusCode: error?.response?.status,
});

const validationFailure = (
  message
) => ({
  status: false,
  message,
});

export const fetchExams = async (filters = {}) => {
  try {
    const response = await api.get(ENDPOINT, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل الاختبارات");
  }
};

export const fetchTeacherExams = async (filters = {}) => {
  try {
    const response = await api.get(`${ENDPOINT}/teacher/me`, {
      params: filters,
    });
    return response.data;
  } catch (error) {
    // Fallback if endpoint is unavailable on legacy backend
    if (error?.response?.status === 404) {
      return fetchExams(filters);
    }
    return normalizeFailure(error, "تعذر تحميل اختبارات المعلم");
  }
};

export const fetchSingleExam = async (id) => {
  try {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر تحميل بيانات الاختبار");
  }
};

export const addExam = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر إضافة الاختبار");
  }
};

export const editExam = async (data, id) => {
  try {
    const response = await api.patch(`${ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر تعديل الاختبار");
  }
};

export const deleteExam = async (id) => {
  try {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر حذف الاختبار");
  }
};

export const addExamQuestion = async (examId, question) => {
  try {
    const response = await api.post(
      `${ENDPOINT}/${examId}/questions`,
      question
    );
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر إضافة السؤال");
  }
};

export const editExamQuestion = async (
  examId,
  questionId,
  question
) => {
  try {
    const response = await api.patch(
      `${ENDPOINT}/${examId}/questions/${questionId}`,
      question
    );
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر تعديل السؤال");
  }
};

export const deleteExamQuestion = async (
  examId,
  questionId
) => {
  try {
    const response = await api.delete(
      `${ENDPOINT}/${examId}/questions/${questionId}`
    );
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر حذف السؤال");
  }
};

/**
 * التوثيق الحالي للباك يعتمد الصيغة التالية:
 * { score, teacherNotes }
 *
 * نرسلها أولًا، ونستخدم achievedGrade فقط كحل احتياطي للتوافق
 * مع نسخ Postman أو الباك القديمة عند ظهور خطأ Validation (400/422).
 */
export const gradeExamStudent = async (
  examId,
  studentId,
  scoreOrPayload,
  teacherNotes = ""
) => {
  const numericScore = Number(
    scoreOrPayload && typeof scoreOrPayload === "object"
      ? scoreOrPayload.achievedGrade ??
          scoreOrPayload.score ??
          scoreOrPayload.grade
      : scoreOrPayload
  );

  const notes = String(
    scoreOrPayload && typeof scoreOrPayload === "object"
      ? scoreOrPayload.teacherNotes ||
          scoreOrPayload.notes ||
          ""
      : teacherNotes || ""
  ).trim();

  if (!examId || !studentId) {
    return validationFailure(
      "بيانات الاختبار أو الطالب غير مكتملة"
    );
  }

  if (!Number.isFinite(numericScore)) {
    return validationFailure(
      "درجة الطالب غير صالحة"
    );
  }

  const url = `${ENDPOINT}/${examId}/students/${studentId}/grade`;

  const primaryPayload = {
    score: numericScore,
  };

  if (notes) {
    primaryPayload.teacherNotes = notes;
  }

  try {
    const response = await api.patch(url, primaryPayload);
    return response.data;
  } catch (error) {
    const status = Number(error?.response?.status || 0);

    // لا نكرر الطلب عند أخطاء الصلاحيات أو الشبكة أو الخادم.
    if (![400, 422].includes(status)) {
      return normalizeFailure(error, "تعذر حفظ درجة الطالب");
    }

    try {
      const response = await api.patch(url, {
        achievedGrade: numericScore,
      });
      return response.data;
    } catch (fallbackError) {
      return normalizeFailure(
        fallbackError,
        "تعذر حفظ درجة الطالب"
      );
    }
  }
};

export const overrideExamGrade = gradeExamStudent;

export default {
  fetchExams,
  fetchTeacherExams,
  fetchSingleExam,
  addExam,
  editExam,
  deleteExam,
  addExamQuestion,
  editExamQuestion,
  deleteExamQuestion,
  gradeExamStudent,
  overrideExamGrade,
};

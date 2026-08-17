import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

// =====================================================
// RESPONSE HELPERS
// =====================================================

export const unwrapData = (response) => {
  const payload = response?.data ?? response;

  if (payload == null) {
    return null;
  }

  return payload?.data ?? payload;
};

export const unwrapList = (response) => {
  const data = unwrapData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.docs)) {
    return data.docs;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
};

// =====================================================
// REQUEST WRAPPER
// Uses the same Axios instance as the rest of the app.
// Token / baseURL stay centralized in src/APIs/Axios.
// =====================================================

const safeGet = async (url, config = {}) => {
  try {
    return await api.get(url, config);
  } catch (error) {
    const message =
      getApiError?.(error) ||
      error?.response?.data?.message ||
      error?.message ||
      "حدث خطأ أثناء تحميل البيانات";

    const normalizedError = new Error(
      typeof message === "string"
        ? message
        : "حدث خطأ أثناء تحميل البيانات"
    );

    normalizedError.status = error?.response?.status;
    normalizedError.response = error?.response;
    normalizedError.payload = error?.response?.data;

    throw normalizedError;
  }
};

// =====================================================
// STUDENT PROFILE
// GET /students/me
// =====================================================

export const getStudentMe = () =>
  safeGet("/students/me");

// =====================================================
// STUDENT SCHEDULE
// GET /lectures/student/me
// =====================================================

export const getStudentLectures = () =>
  safeGet("/lectures/student/me");

// =====================================================
// STUDENT ATTENDANCE
// GET /attendance/student/me
// =====================================================

export const getStudentAttendance = () =>
  safeGet("/attendance/student/me");

// =====================================================
// STUDENT SUBJECTS
// GET /gradesCriteria/student/me/subjects
// =====================================================

export const getStudentSubjects = () =>
  safeGet("/gradesCriteria/student/me/subjects");

// =====================================================
// STUDENT GRADING CRITERIA
// =====================================================

export const getStudentGradingCriteria = (
  subjectOfferingId
) =>
  safeGet("/gradesCriteria/student/me", {
    params: {
      subjectOfferingId,
    },
  });

// =====================================================
// STUDENT GRADES
// =====================================================

export const getStudentGrades = (
  subjectOfferingId
) =>
  safeGet("/gradesCriteria/student/me/grades", {
    params: {
      subjectOfferingId,
    },
  });

// =====================================================
// STUDENT EXAMS
// GET /exams/student/me
// =====================================================

export const getStudentExams = () =>
  safeGet("/exams/student/me");

import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

// =====================================================
// HELPERS
// =====================================================

const cleanParams = (params = {}) => {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
};

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
// =====================================================

const safeGet = async (
  url,
  config = {}
) => {
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

    normalizedError.status =
      error?.response?.status;

    normalizedError.response =
      error?.response;

    normalizedError.payload =
      error?.response?.data;

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
// STUDENT CLASS
// GET /students/me
//
// الـ endpoint بيرجع بيانات الطالب ومعها classId/class.
// نحافظ على نفس contract القديم: response.data = class.
// =====================================================

export const getStudentClass = async () => {
  const response =
    await safeGet("/students/me");

  const student =
    unwrapData(response);

  return {
    ...response,
    data:
      student?.classId ||
      student?.class ||
      null,
  };
};

// =====================================================
// STUDENT CLASSMATES
//
// لا يوجد Endpoint آمن للزملاء حاليًا.
// نحافظ على الـ export للتوافق فقط بدون أي Network Request.
// =====================================================

export const getStudentMates = async () => ({
  data: {
    status: false,
    message:
      "ميزة زملاء الفصل غير متاحة حاليًا حتى يوفر الباك Endpoint آمنًا لها",
    data: [],
  },
});

// =====================================================
// STUDENT SUBJECTS
// GET /subjects/student/me
//
// ده المصدر الأساسي للمواد في:
// - Dashboard
// - MySubjects
// - Filters
//
// مش gradesCriteria/student/me/subjects
// =====================================================

export const getStudentSubjects = () =>
  safeGet("/subjects/student/me");

// =====================================================
// STUDENT SCHEDULE
// GET /lectures/student/me
//
// لا يوجد fallback إلى GET /lectures.
// =====================================================

export const getStudentLectures = () =>
  safeGet("/lectures/student/me");

// =====================================================
// STUDENT ABSENCES
// GET /attendance/student/me
//
// كل Record هنا = غياب.
// =====================================================

export const getStudentAttendance = () =>
  safeGet("/attendance/student/me");

// =====================================================
// SUBJECTS AVAILABLE FOR GRADES
// GET /gradesCriteria/student/me/subjects
//
// ده نستخدمه فقط في سياق الدرجات.
// =====================================================

export const getStudentGradeSubjects = () =>
  safeGet(
    "/gradesCriteria/student/me/subjects"
  );

// =====================================================
// STUDENT GRADING CRITERIA
// GET /gradesCriteria/student/me
//
// Prefer subjectOfferingId
// =====================================================

export const getStudentGradingCriteria = (
  subjectOfferingId
) =>
  safeGet(
    "/gradesCriteria/student/me",
    {
      params: cleanParams({
        subjectOfferingId,
      }),
    }
  );

// =====================================================
// STUDENT GRADES
// GET /gradesCriteria/student/me/grades
//
// Prefer subjectOfferingId
// =====================================================

export const getStudentGrades = (
  subjectOfferingId
) =>
  safeGet(
    "/gradesCriteria/student/me/grades",
    {
      params: cleanParams({
        subjectOfferingId,
      }),
    }
  );

// =====================================================
// STUDENT EXAMS
// GET /exams/student/me
// =====================================================

export const getStudentExams = (
  filters = {}
) =>
  safeGet(
    "/exams/student/me",
    {
      params: cleanParams(filters),
    }
  );

// =====================================================
// STUDENT PROJECTS
// GET /projects/student/me
// =====================================================

export const getStudentProjects = (
  filters = {}
) =>
  safeGet(
    "/projects/student/me",
    {
      params: cleanParams(filters),
    }
  );

// =====================================================
// STUDENT PROJECT SUBMISSION
// GET /projects/:projectId/my-submission
// =====================================================

export const getStudentProjectSubmission = (
  projectId
) => {
  if (!projectId) {
    return Promise.reject(
      new Error("projectId مطلوب")
    );
  }

  return safeGet(
    `/projects/${projectId}/my-submission`
  );
};

// =====================================================
// LIBRARY
// GET /library
//
// مفيش Student-specific endpoint للمكتبة.
// الطالب له صلاحية قراءة الـ Library العادية.
// =====================================================

export const getStudentLibrary = (
  filters = {}
) =>
  safeGet("/library", {
    params: cleanParams(filters),
  });

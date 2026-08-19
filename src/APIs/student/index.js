import { api } from "../Axios";

const normalizeFailure = (
  err,
  fallback = "حدث خطأ ما"
) => ({
  status: false,
  message:
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    fallback,
  statusCode:
    err?.response?.status,
});

export const fetchStudentLectures = async () => {
  try {
    const response = await api.get("/lectures/student/me");
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentAttendance = async () => {
  try {
    const response = await api.get("/attendance/student/me");
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentSubjects = async () => {
  try {
    const response = await api.get("/subjects/student/me");
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentExams = async (filters) => {
  try {
    const response = await api.get("/exams/student/me", { params: filters });
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentProjects = async (filters) => {
  try {
    const response = await api.get("/projects/student/me", { params: filters });
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentGrades = async (filters) => {
  try {
    const response = await api.get("/gradesCriteria/student/me/grades", { params: filters });
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchStudentMates = async () => ({
  status: false,
  message:
    "ميزة زملاء الفصل غير متاحة حاليًا حتى يوفر الباك Endpoint آمنًا لها",
  data: [],
});

export const startStudentExam = async (examId) => {
  try {
    const response = await api.post(`/exams/${examId}/start`);
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const gradeStudentExam = async (examId, data) => {
  try {
    const response = await api.post(`/exams/${examId}/grade`, data);
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const fetchProjectSubmission = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/my-submission`);
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};

export const submitProject = async (projectId, files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await api.post(`/projects/${projectId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (err) {
    return normalizeFailure(err);
  }
};
